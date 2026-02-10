/**
 * Real-time Collaboration UI Component
 * Displays active users in the current project
 */

class CollaborationUI {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.containerId = options.containerId || 'collaboration-panel';
        this.socket = options.socket || null;

        this.activeUsers = new Map(); // socketId -> user data
        this.container = null;

        this.init();
    }

    init() {
        console.log('CollaborationUI: initializing', { projectId: this.projectId, containerId: this.containerId });
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.warn('Collaboration UI: Container not found', this.containerId);
            return;
        }

        // Create UI structure
        this.render();

        // Connect to Socket.io if not provided
        if (!this.socket && typeof io !== 'undefined') {
            console.log('CollaborationUI: connecting socket...');
            this.connectSocket();
        } else if (this.socket) {
            console.log('CollaborationUI: using existing socket');
            this.setupSocketListeners();
        } else {
            console.warn('CollaborationUI: socket.io not defined');
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="collaboration-users" style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 12px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <span class="material-icons-round" style="font-size: 18px; color: var(--text-secondary);">group</span>
                <div id="user-avatars" style="display: flex; gap: 4px;"></div>
                <span id="user-count" style="font-size: 12px; color: var(--text-secondary); margin-left: 4px;">0</span>
            </div>
        `;

        this.userAvatarsDiv = this.container.querySelector('#user-avatars');
        this.userCountSpan = this.container.querySelector('#user-count');
    }

    async connectSocket() {
        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            if (!token) {
                console.warn('Collaboration UI: No auth token');
                return;
            }

            this.socket = io({
                auth: { token }
            });

            this.setupSocketListeners();

            // Join project room
            if (this.projectId) {
                console.log('CollaborationUI: joining project', this.projectId);
                this.socket.emit('join-project', this.projectId);
            } else {
                console.warn('CollaborationUI: no projectId to join');
            }
        } catch (error) {
            console.error('Socket connection error:', error);
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;

        // User joined
        this.socket.on('user-joined', (user) => {
            this.addUser(user);
        });

        // User left
        this.socket.on('user-left', (data) => {
            this.removeUser(data.userId);
        });

        // Initial room users
        this.socket.on('room-users', (users) => {
            users.forEach(user => this.addUser(user));
        });

        // Connection established
        this.socket.on('connect', () => {
            if (this.projectId) {
                this.socket.emit('join-project', this.projectId);
            }
        });
    }

    addUser(user) {
        // Use userId as the primary key for deduplication if available
        const key = user.userId || user.socketId;

        // If user already exists (by userId), update the socketId but don't add a new entry
        if (this.activeUsers.has(key)) {
            const existing = this.activeUsers.get(key);
            // Update socketId in case it changed (reconnection/new tab)
            if (user.socketId) existing.socketId = user.socketId;
            return;
        }

        this.activeUsers.set(key, user);
        this.updateUI();
    }

    removeUser(userId) {
        // Find and remove by userId
        for (const [key, user] of this.activeUsers.entries()) {
            if (user.userId === userId || user.userId.toString() === userId.toString()) {
                this.activeUsers.delete(key);
                break;
            }
        }
        this.updateUI();
    }

    updateUI() {
        if (!this.userAvatarsDiv || !this.userCountSpan) return;

        this.userAvatarsDiv.innerHTML = '';

        const users = Array.from(this.activeUsers.values());

        // Show up to 5 avatars
        const displayUsers = users.slice(0, 5);

        displayUsers.forEach(user => {
            const avatar = this.createAvatar(user);
            this.userAvatarsDiv.appendChild(avatar);
        });

        // Update count
        const totalCount = users.length;
        this.userCountSpan.textContent = totalCount;

        // Update tooltip
        if (totalCount > 0) {
            const names = users.map(u => u.name).join(', ');
            this.container.title = `Online: ${names}`;
        } else {
            this.container.title = 'No users online';
        }
    }

    createAvatar(user) {
        const div = document.createElement('div');
        div.className = 'user-avatar-mini';
        div.title = user.name || 'User';

        div.style.cssText = `
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: 600;
            border: 2px solid rgba(255, 255, 255, 0.2);
            position: relative;
            cursor: pointer;
            transition: transform 0.2s;
        `;

        // Use avatar image if available
        if (user.avatar) {
            div.style.backgroundImage = `url(${user.avatar})`;
            div.style.backgroundSize = 'cover';
            div.style.backgroundPosition = 'center';
        } else {
            // Use initials
            const initials = this.getInitials(user.name);
            div.textContent = initials;
        }

        // Online indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22c55e;
            border: 2px solid var(--bg-primary);
        `;
        div.appendChild(indicator);

        // Hover effect
        div.addEventListener('mouseenter', () => {
            div.style.transform = 'scale(1.15)';
        });
        div.addEventListener('mouseleave', () => {
            div.style.transform = 'scale(1)';
        });

        return div;
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    destroy() {
        if (this.socket) {
            if (this.projectId) {
                this.socket.emit('leave-project', this.projectId);
            }
            this.socket.off('user-joined');
            this.socket.off('user-left');
            this.socket.off('room-users');
        }
    }
}

// Export for use in workspaces
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborationUI;
}
