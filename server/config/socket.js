const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');

/**
 * Configure Socket.io for real-time collaboration
 */
const disconnectTimeouts = new Map(); // Store disconnect timeouts: userId -> { timeout, projectId }

const configureSocket = (io) => {
    // Authentication middleware - allow anonymous for dev
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                // Allow anonymous connection for development
                console.log('⚠️ Socket: Anonymous connection (no token)');
                socket.user = {
                    _id: 'anonymous-' + socket.id,
                    name: 'Guest-' + socket.id.substring(0, 5),
                    avatar: null,
                    isAnonymous: true
                };
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-passwordHash');

            if (!user) {
                console.log('⚠️ Socket: User not found in DB');
                return next(new Error('User not found'));
            }

            socket.user = user;
            console.log(`✅ Socket: Authenticated as ${user.name}`);
            next();
        } catch (error) {
            console.log('⚠️ Socket: Token verification failed, allowing as guest');
            socket.user = {
                _id: 'guest-' + socket.id,
                name: 'Guest-' + socket.id.substring(0, 5),
                avatar: null,
                isAnonymous: true
            };
            next();
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`👤 User connected: ${socket.user.name} (${socket.id})`);

        // Join project room
        socket.on('join-project', async (data) => {
            try {
                // Support both string (legacy) and object payload
                const projectId = typeof data === 'object' ? data.projectId : data;
                const initialPath = typeof data === 'object' ? data.path : null;

                console.log(`📁 Join request for project: ${projectId} by ${socket.user.name}`);

                // Set path immediately if provided (fixes race condition with user-location event)
                if (initialPath) {
                    socket.currentPath = initialPath;
                }

                // Check for pending disconnect timeout (seamless reconnection)
                const userIdStr = socket.user._id.toString();
                let isReconnection = false;

                if (disconnectTimeouts.has(userIdStr)) {
                    const { timeout, projectId: oldPid } = disconnectTimeouts.get(userIdStr);
                    if (oldPid === projectId) {
                        clearTimeout(timeout);
                        disconnectTimeouts.delete(userIdStr);
                        isReconnection = true;
                        console.log(`🔄 Seamless reconnection for ${socket.user.name} in project ${projectId}`);
                    }
                }

                let role = 'editor'; // Default role for collaboration

                // Only check membership for authenticated users
                if (!socket.user.isAnonymous) {
                    const membership = await ProjectMember.findOne({
                        projectId,
                        userId: socket.user._id
                    });

                    if (membership) {
                        role = membership.role;
                    } else {
                        // Check if project is public or use dev mode
                        const project = await Project.findById(projectId);
                        if (project && !project.settings?.isPublic) {
                            // For dev testing, still allow but as viewer
                            console.log(`⚠️ User ${socket.user.name} not member of project ${projectId}, allowing as viewer`);
                            role = 'viewer';
                        }
                    }
                }

                // Join the room
                socket.join(`project:${projectId}`);
                socket.currentProject = projectId;
                socket.currentRole = role;

                // Notify others in the room (skip sockets of same user to prevent self-duplication)
                const currentUserId = socket.user._id.toString();
                const room = io.sockets.adapter.rooms.get(`project:${projectId}`);

                if (room) {
                    for (const sid of room) {
                        const s = io.sockets.sockets.get(sid);
                        // Only emit to sockets of DIFFERENT users
                        if (s && s.user && s.id !== socket.id && s.user._id.toString() !== currentUserId) {
                            s.emit('user-joined', {
                                socketId: socket.id,
                                userId: socket.user._id,
                                name: socket.user.name,
                                avatar: socket.user.avatar,
                                role: role,
                                currentPath: socket.currentPath,
                                isReconnection: isReconnection
                            });
                        }
                    }
                }

                // Send current users in room (deduplicated by userId, excluding self)
                const usersInRoom = [];
                const seenUserIds = new Set();

                if (room) {
                    for (const socketId of room) {
                        const s = io.sockets.sockets.get(socketId);
                        if (s && s.user && s.id !== socket.id) {
                            const uid = s.user._id.toString();
                            // Skip self (same user on different tab)
                            if (uid === currentUserId) continue;
                            // Deduplicate by userId
                            if (seenUserIds.has(uid)) continue;
                            seenUserIds.add(uid);

                            usersInRoom.push({
                                socketId: s.id,
                                userId: s.user._id,
                                name: s.user.name,
                                avatar: s.user.avatar,
                                role: s.currentRole,
                                currentPath: s.currentPath || null
                            });
                        }
                    }
                }

                socket.emit('room-users', usersInRoom);
                console.log(`✅ ${socket.user.name} joined project ${projectId} (${usersInRoom.length} others online)`);
            } catch (error) {
                console.error('❌ Join project error:', error);
                socket.emit('error', { message: 'Failed to join project' });
            }
        });

        // Leave project room
        socket.on('leave-project', (projectId) => {
            socket.leave(`project:${projectId}`);

            // Only broadcast user-left if this user has no other sockets in the room
            const currentUserId = socket.user._id.toString();
            const room = io.sockets.adapter.rooms.get(`project:${projectId}`);
            let stillPresent = false;
            if (room) {
                for (const sid of room) {
                    const s = io.sockets.sockets.get(sid);
                    if (s && s.user && s.user._id.toString() === currentUserId) {
                        stillPresent = true;
                        break;
                    }
                }
            }

            if (!stillPresent) {
                io.to(`project:${projectId}`).emit('user-left', {
                    userId: socket.user._id,
                    name: socket.user.name
                });
            }

            socket.currentProject = null;
            socket.currentPath = null;
            console.log(`${socket.user.name} left project ${projectId}`);
        });

        // User Location Update
        socket.on('user-location', (path) => {
            if (!socket.currentProject) return;

            socket.currentPath = path;

            // Broadcast to sockets of DIFFERENT users only
            const currentUserId = socket.user._id.toString();
            const room = io.sockets.adapter.rooms.get(`project:${socket.currentProject}`);

            if (room) {
                for (const sid of room) {
                    const s = io.sockets.sockets.get(sid);
                    if (s && s.user && s.id !== socket.id && s.user._id.toString() !== currentUserId) {
                        s.emit('user-location-update', {
                            userId: socket.user._id,
                            socketId: socket.id,
                            path: path
                        });
                    }
                }
            }
        });

        // Canvas update (for real-time collaboration)
        socket.on('canvas-update', (data) => {
            if (!socket.currentProject) return;

            // Only editors and owners can update
            if (socket.currentRole === 'viewer') {
                socket.emit('error', { message: 'Viewers cannot edit' });
                return;
            }

            // Broadcast to others in the room
            socket.to(`project:${socket.currentProject}`).emit('canvas-update', {
                userId: socket.user._id,
                userName: socket.user.name,
                ...data
            });
        });

        // Cursor movement
        socket.on('cursor-move', (position) => {
            if (!socket.currentProject) return;

            const currentUserId = socket.user._id.toString();
            const room = io.sockets.adapter.rooms.get(`project:${socket.currentProject}`);

            if (room) {
                for (const sid of room) {
                    const s = io.sockets.sockets.get(sid);
                    // Only send cursor to sockets of DIFFERENT users
                    if (s && s.user && s.id !== socket.id && s.user._id.toString() !== currentUserId) {
                        s.emit('cursor-update', {
                            socketId: socket.id,
                            userId: socket.user._id,
                            name: socket.user.name,
                            avatar: socket.user.avatar,
                            currentPath: socket.currentPath || null,
                            position: {
                                x: position.x,
                                y: position.y
                            }
                        });
                    }
                }
            }
        });

        // Selection change
        socket.on('selection-change', (selection) => {
            if (!socket.currentProject) return;

            socket.to(`project:${socket.currentProject}`).emit('selection-update', {
                userId: socket.user._id,
                name: socket.user.name,
                selection
            });
        });

        // Chat message
        socket.on('chat-message', (message) => {
            if (!socket.currentProject) return;

            io.to(`project:${socket.currentProject}`).emit('chat-message', {
                userId: socket.user._id,
                name: socket.user.name,
                avatar: socket.user.avatar,
                message: message.text,
                timestamp: new Date()
            });
        });

        // Typing indicator
        socket.on('typing-start', () => {
            if (!socket.currentProject) return;

            socket.to(`project:${socket.currentProject}`).emit('user-typing', {
                userId: socket.user._id,
                name: socket.user.name
            });
        });

        socket.on('typing-stop', () => {
            if (!socket.currentProject) return;

            socket.to(`project:${socket.currentProject}`).emit('user-stopped-typing', {
                userId: socket.user._id
            });
        });
        // ===============================
        // Real-time Workflow Collaboration
        // ===============================

        // Join workflow room
        socket.on('workflow:join', (workflowId) => {
            socket.join(`workflow:${workflowId}`);
            socket.currentWorkflow = workflowId;
            console.log(`User ${socket.user.name} joined workflow ${workflowId}`);

            // Notify others
            socket.to(`workflow:${workflowId}`).emit('workflow:user-joined', {
                socketId: socket.id,
                userId: socket.user._id,
                name: socket.user.name,
                avatar: socket.user.avatar
            });

            // Send current users
            const room = io.sockets.adapter.rooms.get(`workflow:${workflowId}`);
            const usersInRoom = [];
            if (room) {
                for (const socketId of room) {
                    const s = io.sockets.sockets.get(socketId);
                    if (s && s.user) {
                        usersInRoom.push({
                            socketId: s.id, // Need socketId for cursor cleanup often
                            userId: s.user._id,
                            name: s.user.name,
                            avatar: s.user.avatar
                        });
                    }
                }
            }
            socket.emit('workflow:room-users', usersInRoom);
        });

        // Leave workflow room
        socket.on('workflow:leave', (workflowId) => {
            socket.leave(`workflow:${workflowId}`);
            socket.to(`workflow:${workflowId}`).emit('workflow:user-left', {
                userId: socket.user._id,
                socketId: socket.id
            });
            socket.currentWorkflow = null;
            console.log(`User ${socket.user.name} left workflow ${workflowId}`);
        });

        // Add Node
        socket.on('workflow:node:add', (node) => {
            if (!socket.currentWorkflow) return;
            // Broadcast to others in the same workflow room
            socket.to(`workflow:${socket.currentWorkflow}`).emit('workflow:node:add', node);
        });

        // Update Node (position, data)
        socket.on('workflow:node:update', (data) => {
            if (!socket.currentWorkflow) return;
            socket.to(`workflow:${socket.currentWorkflow}`).emit('workflow:node:update', data);
        });

        // Delete Node
        socket.on('workflow:node:delete', (nodeId) => {
            if (!socket.currentWorkflow) return;
            socket.to(`workflow:${socket.currentWorkflow}`).emit('workflow:node:delete', nodeId);
        });

        // Add Connection
        socket.on('workflow:connection:add', (connection) => {
            if (!socket.currentWorkflow) return;
            socket.to(`workflow:${socket.currentWorkflow}`).emit('workflow:connection:add', connection);
        });

        // Delete Connection
        socket.on('workflow:connection:delete', (connectionId) => {
            if (!socket.currentWorkflow) return;
            socket.to(`workflow:${socket.currentWorkflow}`).emit('workflow:connection:delete', connectionId);
        });

        // Update Node Documentation
        socket.on('workflow:node:doc-update', (data) => {
            if (!socket.currentWorkflow) return;
            socket.to(`workflow:${socket.currentWorkflow}`).emit('workflow:node:doc-update', data);
        });

        // Workflow Cursor Tracking
        socket.on('workflow:cursor', (data) => {
            if (!socket.currentWorkflow) return;
            socket.to(`workflow:${socket.currentWorkflow}`).emit('workflow:cursor', {
                userId: socket.user._id,
                userName: socket.user.name,
                x: data.x,
                y: data.y,
                timestamp: Date.now()
            });
        });


        // ===============================
        // Real-time Notes Collaboration
        // ===============================

        // Note content update (real-time sync)
        socket.on('note-update', (data) => {
            if (!socket.currentProject) return;
            if (socket.currentRole === 'viewer') return;

            socket.to(`project:${socket.currentProject}`).emit('note-update', {
                userId: socket.user._id,
                userName: socket.user.name,
                noteId: data.noteId,
                content: data.content,
                title: data.title,
                timestamp: new Date()
            });
        });

        // Note cursor position (for collaborative editing)
        socket.on('note-cursor', (data) => {
            if (!socket.currentProject) return;

            socket.to(`project:${socket.currentProject}`).emit('note-cursor', {
                userId: socket.user._id,
                userName: socket.user.name,
                noteId: data.noteId,
                position: data.position,
                selection: data.selection
            });
        });

        // ===============================
        // Real-time Drawing Collaboration
        // ===============================

        // Drawing stroke (broadcast each stroke in real-time)
        socket.on('drawing-stroke', (data) => {
            if (!socket.currentProject) return;
            if (socket.currentRole === 'viewer') return;

            socket.to(`project:${socket.currentProject}`).emit('drawing-stroke', {
                userId: socket.user._id,
                userName: socket.user.name,
                currentPath: socket.currentPath || null,
                points: data.points,
                color: data.color,
                size: data.size,
                opacity: data.opacity,
                tool: data.tool, // 'pen', 'eraser', 'highlighter'
                timestamp: new Date()
            });
        });

        // Drawing clear (broadcast canvas clear)
        socket.on('drawing-clear', () => {
            if (!socket.currentProject) return;
            if (socket.currentRole === 'viewer') return;

            socket.to(`project:${socket.currentProject}`).emit('drawing-clear', {
                userId: socket.user._id,
                userName: socket.user.name,
                currentPath: socket.currentPath || null,
                timestamp: new Date()
            });
        });

        // Sticky note create/update/delete
        socket.on('sticky-note-update', (data) => {
            if (!socket.currentProject) return;
            if (socket.currentRole === 'viewer') return;

            socket.to(`project:${socket.currentProject}`).emit('sticky-note-update', {
                userId: socket.user._id,
                userName: socket.user.name,
                currentPath: socket.currentPath || null,
                action: data.action, // 'create', 'update', 'delete', 'move'
                noteData: data.noteData,
                timestamp: new Date()
            });
        });

        // ===============================
        // Real-time CAD Collaboration
        // ===============================

        // CAD: Add primitive object
        socket.on('cad:add-primitive', (data) => {
            if (!socket.currentProject) return;
            if (socket.currentRole === 'viewer') return;

            socket.to(`project:${socket.currentProject}`).emit('cad:add-primitive', {
                userId: socket.user._id,
                userName: socket.user.name,
                type: data.type,
                uuid: data.uuid,
                position: data.position,
                rotation: data.rotation,
                scale: data.scale,
                color: data.color,
                name: data.name,
                timestamp: new Date()
            });
        });

        // CAD: Object transform update (position/rotation/scale)
        socket.on('cad:transform-update', (data) => {
            if (!socket.currentProject) return;
            if (socket.currentRole === 'viewer') return;

            socket.to(`project:${socket.currentProject}`).emit('cad:transform-update', {
                userId: socket.user._id,
                userName: socket.user.name,
                uuid: data.uuid,
                position: data.position,
                rotation: data.rotation,
                scale: data.scale,
                timestamp: new Date()
            });
        });

        // CAD: Delete object
        socket.on('cad:delete-object', (data) => {
            if (!socket.currentProject) return;
            if (socket.currentRole === 'viewer') return;

            socket.to(`project:${socket.currentProject}`).emit('cad:delete-object', {
                userId: socket.user._id,
                userName: socket.user.name,
                uuid: data.uuid,
                timestamp: new Date()
            });
        });

        // CAD: Material change
        socket.on('cad:material-update', (data) => {
            if (!socket.currentProject) return;
            if (socket.currentRole === 'viewer') return;

            socket.to(`project:${socket.currentProject}`).emit('cad:material-update', {
                userId: socket.user._id,
                userName: socket.user.name,
                uuid: data.uuid,
                color: data.color,
                metalness: data.metalness,
                roughness: data.roughness,
                timestamp: new Date()
            });
        });

        // CAD: Select object (show remote selection)
        socket.on('cad:select-object', (data) => {
            if (!socket.currentProject) return;

            socket.to(`project:${socket.currentProject}`).emit('cad:select-object', {
                userId: socket.user._id,
                userName: socket.user.name,
                uuid: data.uuid, // null means deselect
                timestamp: new Date()
            });
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.name} (socket: ${socket.id})`);

            if (socket.currentProject) {
                const userId = socket.user._id.toString();
                const projectId = socket.currentProject;
                const userName = socket.user.name;

                // Delay user-left event to allow for page navigation (seamless transition)
                const timeout = setTimeout(() => {
                    // Check if the user still has ANY active socket in the room
                    const room = io.sockets.adapter.rooms.get(`project:${projectId}`);
                    let stillPresent = false;
                    if (room) {
                        for (const sid of room) {
                            const s = io.sockets.sockets.get(sid);
                            if (s && s.user && s.user._id.toString() === userId) {
                                stillPresent = true;
                                break;
                            }
                        }
                    }

                    if (!stillPresent) {
                        // Use io.to() instead of socket.to() because the socket is already disconnected
                        io.to(`project:${projectId}`).emit('user-left', {
                            userId: socket.user._id,
                            name: userName
                        });
                        console.log(`❌ ${userName} genuinely left project ${projectId}`);
                    } else {
                        console.log(`🔄 ${userName} still has active connections in project ${projectId}, not emitting user-left`);
                    }
                    disconnectTimeouts.delete(userId);
                }, 3000); // 3 second grace period

                disconnectTimeouts.set(userId, { timeout, projectId });
            }
        });
    });

    return io;
};

module.exports = configureSocket;
