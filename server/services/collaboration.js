/**
 * Collaboration Service
 * Handles real-time collaboration logic
 */

const Project = require('../models/Project');
const Version = require('../models/Version');

/**
 * Operation Transformation (OT) for concurrent edits
 * This is a simplified version - for production, use a library like ot.js or sharedb
 */
class OperationalTransform {
    /**
     * Transform operation A against operation B
     */
    static transform(opA, opB) {
        // If operations are on different objects, no transformation needed
        if (opA.objectId !== opB.objectId) {
            return opA;
        }

        // Handle different operation types
        switch (opA.type) {
            case 'move':
                return this.transformMove(opA, opB);
            case 'resize':
                return this.transformResize(opA, opB);
            case 'modify':
                return this.transformModify(opA, opB);
            default:
                return opA;
        }
    }

    static transformMove(opA, opB) {
        // If B also moved the same object, use A's position (last writer wins)
        if (opB.type === 'move') {
            return opA;
        }
        return opA;
    }

    static transformResize(opA, opB) {
        if (opB.type === 'resize') {
            return opA;
        }
        return opA;
    }

    static transformModify(opA, opB) {
        if (opB.type === 'modify') {
            // Merge properties, A wins on conflicts
            return {
                ...opA,
                properties: { ...opB.properties, ...opA.properties }
            };
        }
        return opA;
    }
}

/**
 * Collaboration State Manager
 */
class CollaborationManager {
    constructor() {
        this.rooms = new Map(); // projectId -> room state
        this.operationBuffer = new Map(); // projectId -> pending operations
    }

    /**
     * Initialize room for a project
     */
    initRoom(projectId) {
        if (!this.rooms.has(projectId)) {
            this.rooms.set(projectId, {
                users: new Map(), // socketId -> user info
                cursors: new Map(), // socketId -> cursor position
                selections: new Map(), // socketId -> selection
                lastOperation: null,
                operationCount: 0
            });
        }
        return this.rooms.get(projectId);
    }

    /**
     * Add user to room
     */
    addUser(projectId, socketId, userInfo) {
        const room = this.initRoom(projectId);
        room.users.set(socketId, {
            ...userInfo,
            joinedAt: new Date(),
            lastActivity: new Date()
        });
        return room;
    }

    /**
     * Remove user from room
     */
    removeUser(projectId, socketId) {
        const room = this.rooms.get(projectId);
        if (room) {
            room.users.delete(socketId);
            room.cursors.delete(socketId);
            room.selections.delete(socketId);

            // Clean up empty rooms
            if (room.users.size === 0) {
                this.rooms.delete(projectId);
            }
        }
    }

    /**
     * Update cursor position
     */
    updateCursor(projectId, socketId, position) {
        const room = this.rooms.get(projectId);
        if (room) {
            room.cursors.set(socketId, {
                position,
                timestamp: Date.now()
            });

            const user = room.users.get(socketId);
            if (user) {
                user.lastActivity = new Date();
            }
        }
    }

    /**
     * Update selection
     */
    updateSelection(projectId, socketId, selection) {
        const room = this.rooms.get(projectId);
        if (room) {
            room.selections.set(socketId, selection);
        }
    }

    /**
     * Get room state
     */
    getRoomState(projectId) {
        const room = this.rooms.get(projectId);
        if (!room) return null;

        return {
            users: Array.from(room.users.entries()).map(([socketId, user]) => ({
                socketId,
                ...user
            })),
            cursors: Object.fromEntries(room.cursors),
            selections: Object.fromEntries(room.selections)
        };
    }

    /**
     * Apply operation and return transformed result
     */
    applyOperation(projectId, operation) {
        const room = this.rooms.get(projectId);
        if (!room) return operation;

        // Transform against last operation if needed
        if (room.lastOperation && operation.timestamp < room.lastOperation.timestamp) {
            operation = OperationalTransform.transform(operation, room.lastOperation);
        }

        room.lastOperation = operation;
        room.operationCount++;

        return operation;
    }
}

// Singleton instance
const collaborationManager = new CollaborationManager();

/**
 * Auto-save project state
 */
const autoSaveProject = async (projectId, canvasState, userId) => {
    try {
        const project = await Project.findById(projectId);
        if (!project) return;

        project.canvasState = canvasState;
        project.stats.lastEditedAt = new Date();
        project.stats.lastEditedBy = userId;
        await project.save();

        // Create auto-save version every 5 minutes
        const lastAutoSave = await Version.findOne({
            projectId,
            isAutoSave: true
        }).sort({ createdAt: -1 });

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        if (!lastAutoSave || lastAutoSave.createdAt < fiveMinutesAgo) {
            await Version.create({
                projectId,
                createdBy: userId,
                name: `Auto-save ${new Date().toLocaleString()}`,
                snapshot: canvasState,
                isAutoSave: true
            });

            // Cleanup old auto-saves
            await Version.cleanupAutoSaves(projectId, 10);
        }

    } catch (error) {
        console.error('Auto-save error:', error);
    }
};

/**
 * Debounced save for high-frequency updates
 */
const saveDebounceMap = new Map();

const debouncedSave = (projectId, canvasState, userId, delay = 2000) => {
    if (saveDebounceMap.has(projectId)) {
        clearTimeout(saveDebounceMap.get(projectId));
    }

    const timeout = setTimeout(() => {
        autoSaveProject(projectId, canvasState, userId);
        saveDebounceMap.delete(projectId);
    }, delay);

    saveDebounceMap.set(projectId, timeout);
};

module.exports = {
    collaborationManager,
    OperationalTransform,
    autoSaveProject,
    debouncedSave
};
