/**
 * SIMVEX Collaboration Client
 * Handles real-time collaboration via Socket.io
 */

class CollaborationClient {
    constructor() {
        this.socket = null;
        this.projectId = null;
        this.currentUser = null;
        this.collaborators = new Map();
        this.cursors = new Map();
        this.isConnected = false;
        this.canvasState = {
            objects: [],
            background: '#0f0f1a',
            zoom: 1,
            panX: 0,
            panY: 0
        };
        this.selectedTool = 'select';
        this.selectedObjects = [];
        this.hasCanvas = false; // Flag to check if canvas exists

        this.init();
    }

    hideLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        const workspace = document.querySelector('.workspace');
        if (overlay) overlay.style.display = 'none';
        if (workspace) workspace.style.display = 'flex';
    }

    mapCategory(category) {
        const mapping = {
            'mechanical': 'engineering',
            'medical': 'math',
            'medicine': 'math',
            'math': 'math',
            'earth': 'earthscience'
        };
        return mapping[category] || category;
    }

    async init() {
        // Get project ID from URL
        const params = new URLSearchParams(window.location.search);
        this.projectId = params.get('id') || params.get('projectId') || params.get('project');

        if (!this.projectId) {
            this.showToast('No project ID found', 'error');
            return;
        }

        // Load user info
        try {
            const response = await api.getMe();
            this.currentUser = response.data.user;
        } catch (error) {
            console.log('Not authenticated');
            this.currentUser = { _id: 'guest', name: 'Guest', avatar: null };
        }

        // Setup UI
        this.setupCanvas();
        this.setupEventListeners();
        this.setupPanels();

        // Load project data
        await this.loadProject();

        // Connect to Socket.io
        this.connect();
    }

    connect() {
        //const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const serverUrl = 'https://simvexdong.onrender.com'; // isLocal ? 'http://localhost:3000' : 'https://simvexdong.onrender.com';
        console.log(`Socket connecting to: ${serverUrl}`);
        const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');

        this.socket = io(serverUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to collaboration server');
            this.isConnected = true;
            this.updateConnectionStatus(true);

            // Join project room
            this.socket.emit('join-project', this.projectId);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from collaboration server');
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.showToast(error.message || 'Connection error', 'error');
        });

        // Collaboration events
        this.socket.on('room-users', (users) => {
            users.forEach(user => {
                this.collaborators.set(user.socketId, user);
            });
            this.updateCollaboratorsUI();
        });

        this.socket.on('user-joined', (user) => {
            this.collaborators.set(user.socketId || user.userId, user);
            this.updateCollaboratorsUI();
            this.showJoinPopup(user);

            // Add system message to chat
            this.addChatMessage({
                name: 'System',
                message: `${user.name} has joined.`,
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
                isSystem: true
            });
        });

        this.socket.on('user-left', (user) => {
            this.collaborators.delete(user.socketId || user.userId);
            this.removeCursor(user.userId);
            this.updateCollaboratorsUI();
            this.showToast(`${user.name} has left`, 'info');
        });

        this.socket.on('cursor-update', (data) => {
            this.updateRemoteCursor(data);
        });

        this.socket.on('canvas-update', (data) => {
            this.handleRemoteUpdate(data);
        });

        this.socket.on('selection-update', (data) => {
            this.handleRemoteSelection(data);
        });

        this.socket.on('chat-message', (message) => {
            this.addChatMessage(message);
        });
    }

    async loadProject() {
        try {
            const response = await api.getProject(this.projectId);
            const { project, members, myRole } = response.data;
            console.log('Project loaded:', project);
            console.log('Category:', project.category);

            document.getElementById('projectName').textContent = project.name;
            document.title = `${project.name} - SIMVEX`;

            if (project.canvasState) {
                this.canvasState = project.canvasState;
            }

            this.myRole = myRole;

            // Redirection Failsafe for Specialized Projects
            if (project.category === 'mechanical') {
                window.location.href = `/engineering/index.html?id=${this.projectId}`;
                return;
            }
            if (project.category === 'earth' || project.category === 'earthscience') {
                window.location.href = `/earthscience/index.html?id=${this.projectId}`;
                return;
            }
            if (project.category === 'chemistry') {
                // Ensure we don't redirect if we are already in the chemistry workspace
                if (!window.location.pathname.includes('/chemistry/')) {
                    window.location.href = `/chemistry/study.html?id=${this.projectId}`;
                    return;
                }
            }
            if (project.category === 'biology') {
                if (!window.location.pathname.includes('/biology/')) {
                    window.location.href = `/biology/index.html?id=${this.projectId}`;
                    return;
                }
            }
            const mappedCategory = this.mapCategory(project.category);
            if (mappedCategory === 'math') {
                window.location.href = `/math/index.html?id=${this.projectId}`;
                return;
            }

            // No redirection needed, show workspace
            this.hideLoadingScreen();

            this.renderCanvas();
            this.loadVersions();
            this.loadMembers();

        } catch (error) {
            console.error('Failed to load project:', error);
            // Use demo data
            document.getElementById('projectName').textContent = 'Demo Project';
            this.renderCanvas();
        }
    }

    setupCanvas() {
        const canvas = document.getElementById('mainCanvas');
        if (!canvas) {
            console.log('CollaborationClient: No mainCanvas found. Canvas features disabled.');
            this.hasCanvas = false;
            return;
        }

        this.hasCanvas = true;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Canvas events
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Initial render
        this.renderCanvas();
    }

    resizeCanvas() {
        if (!this.hasCanvas) return;
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.renderCanvas();
    }

    renderCanvas() {
        if (!this.hasCanvas) return;
        const ctx = this.ctx;
        const { width, height } = this.canvas;

        // Clear canvas
        ctx.fillStyle = this.canvasState.background;
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid();

        // Apply transformations
        ctx.save();
        ctx.translate(this.canvasState.panX, this.canvasState.panY);
        ctx.scale(this.canvasState.zoom, this.canvasState.zoom);

        // Draw objects
        this.canvasState.objects.forEach(obj => {
            this.drawObject(obj);
        });

        ctx.restore();
    }

    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 50 * this.canvasState.zoom;
        const { width, height } = this.canvas;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        const offsetX = this.canvasState.panX % gridSize;
        const offsetY = this.canvasState.panY % gridSize;

        for (let x = offsetX; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = offsetY; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawObject(obj) {
        const ctx = this.ctx;

        ctx.fillStyle = obj.fill || '#667eea';
        ctx.strokeStyle = obj.stroke || '#ffffff';
        ctx.lineWidth = obj.strokeWidth || 2;

        switch (obj.type) {
            case 'rectangle':
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                break;

            case 'circle':
                ctx.beginPath();
                ctx.arc(obj.x + obj.radius, obj.y + obj.radius, obj.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;

            case 'line':
                ctx.beginPath();
                ctx.moveTo(obj.x1, obj.y1);
                ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke();
                break;

            case 'text':
                ctx.font = `${obj.fontSize || 16}px Inter`;
                ctx.fillStyle = obj.color || '#ffffff';
                ctx.fillText(obj.text, obj.x, obj.y);
                break;
        }

        // Draw selection indicator
        if (this.selectedObjects.includes(obj.id)) {
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(obj.x - 5, obj.y - 5, (obj.width || obj.radius * 2) + 10, (obj.height || obj.radius * 2) + 10);
            ctx.setLineDash([]);
        }
    }

    handleMouseMove(e) {
        if (!this.hasCanvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update position display
        const posDisplay = document.getElementById('mousePosition');
        if (posDisplay) posDisplay.textContent = `${Math.round(x)}, ${Math.round(y)}`;

        // Send cursor position to collaborators
        if (this.socket && this.isConnected) {
            this.socket.emit('cursor-move', { x, y });
        }
    }

    handleMouseDown(e) {
        this.isMouseDown = true;
        const rect = this.canvas.getBoundingClientRect();
        this.mouseStartX = e.clientX - rect.left;
        this.mouseStartY = e.clientY - rect.top;

        if (this.selectedTool === 'move') {
            this.isPanning = true;
            this.lastPanX = this.canvasState.panX;
            this.lastPanY = this.canvasState.panY;
        }
    }

    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
        } else if (this.selectedTool !== 'select' && this.selectedTool !== 'move') {
            // Create new object
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.canvasState.panX) / this.canvasState.zoom;
            const y = (e.clientY - rect.top - this.canvasState.panY) / this.canvasState.zoom;

            this.createObject(x, y);
        }

        this.isMouseDown = false;
    }

    handleWheel(e) {
        e.preventDefault();

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, this.canvasState.zoom * delta));

        this.canvasState.zoom = newZoom;
        document.getElementById('zoomLevel').textContent = `${Math.round(newZoom * 100)}%`;

        this.renderCanvas();
    }

    createObject(x, y) {
        const obj = {
            id: Date.now().toString(),
            x,
            y,
            type: this.selectedTool,
            fill: '#667eea',
            stroke: '#ffffff',
            strokeWidth: 2
        };

        switch (this.selectedTool) {
            case 'rectangle':
                obj.width = 100;
                obj.height = 80;
                break;
            case 'circle':
                obj.radius = 50;
                break;
            case 'line':
                obj.x1 = x;
                obj.y1 = y;
                obj.x2 = x + 100;
                obj.y2 = y + 100;
                break;
            case 'text':
                obj.text = 'Text';
                obj.fontSize = 16;
                break;
        }

        this.canvasState.objects.push(obj);
        this.renderCanvas();
        this.updateObjectsList();

        // Emit to collaborators
        if (this.socket && this.isConnected) {
            this.socket.emit('canvas-update', {
                type: 'object-add',
                object: obj
            });
        }
    }

    updateRemoteCursor(data) {
        let cursorEl = this.cursors.get(data.userId);

        // Ensure container exists
        let cursorContainer = document.getElementById('remoteCursors');
        if (!cursorContainer) {
            cursorContainer = document.createElement('div');
            cursorContainer.id = 'remoteCursors';
            cursorContainer.style.position = 'absolute';
            cursorContainer.style.top = '0';
            cursorContainer.style.left = '0';
            cursorContainer.style.width = '100%';
            cursorContainer.style.height = '100%';
            cursorContainer.style.pointerEvents = 'none'; // Click-through
            cursorContainer.style.zIndex = '9999'; // On top of everything
            cursorContainer.style.overflow = 'hidden';

            // Try to append to workspace or body
            const workspace = document.querySelector('.workspace-main') || document.body;
            workspace.appendChild(cursorContainer);
        }

        if (!cursorEl) {
            cursorEl = document.createElement('div');
            cursorEl.className = 'remote-cursor';
            cursorEl.innerHTML = `
        <div class="cursor-pointer" style="background: ${this.getUserColor(data.userId)}"></div>
        <div class="cursor-label" style="background: ${this.getUserColor(data.userId)}">${data.name}</div>
      `;
            cursorContainer.appendChild(cursorEl);
            this.cursors.set(data.userId, cursorEl);
        }

        cursorEl.style.left = `${data.position.x}px`;
        cursorEl.style.top = `${data.position.y}px`;
    }

    removeCursor(userId) {
        const cursorEl = this.cursors.get(userId);
        if (cursorEl) {
            cursorEl.remove();
            this.cursors.delete(userId);
        }
    }

    getUserColor(userId) {
        const colors = ['#667eea', '#f093fb', '#43e97b', '#f5576c', '#fa709a', '#4facfe'];
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    handleRemoteUpdate(data) {
        switch (data.type) {
            case 'object-add':
                this.canvasState.objects.push(data.object);
                break;
            case 'object-update':
                const idx = this.canvasState.objects.findIndex(o => o.id === data.object.id);
                if (idx !== -1) {
                    this.canvasState.objects[idx] = data.object;
                }
                break;
            case 'object-delete':
                this.canvasState.objects = this.canvasState.objects.filter(o => o.id !== data.objectId);
                break;
            case 'full-restore':
                this.canvasState = data.data;
                this.showToast('Canvas restored', 'info');
                break;
        }

        this.renderCanvas();
        this.updateObjectsList();
    }

    handleRemoteSelection(data) {
        // Highlight remote user's selection
        console.log('Remote selection:', data);
    }

    setupEventListeners() {
        // Tool buttons
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTool = btn.dataset.tool;
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'v': this.selectTool('select'); break;
                case 'h': this.selectTool('move'); break;
                case 'r': this.selectTool('rectangle'); break;
                case 'o': this.selectTool('circle'); break;
                case 'l': this.selectTool('line'); break;
                case 't': this.selectTool('text'); break;
                case 'delete':
                case 'backspace':
                    this.deleteSelectedObjects();
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.saveProject();
                    }
                    break;
            }
        });

        // Zoom controls (optional - may not exist in all workspaces)
        document.getElementById('zoomInBtn')?.addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => this.zoom(0.8));
        document.getElementById('zoomFitBtn')?.addEventListener('click', () => this.zoomToFit());

        // Save button (optional)
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveProject());

        // Version panel (optional)
        document.getElementById('versionBtn')?.addEventListener('click', () => this.toggleVersionPanel());
        document.getElementById('closeVersionBtn')?.addEventListener('click', () => this.toggleVersionPanel());
        document.getElementById('createVersionBtn')?.addEventListener('click', () => this.createVersion());

        // Chat panel (optional)
        document.getElementById('chatToggleBtn')?.addEventListener('click', () => this.toggleChatPanel());
        document.getElementById('closeChatBtn')?.addEventListener('click', () => this.toggleChatPanel());
        document.getElementById('sendChatBtn')?.addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Invite modal (optional)
        document.getElementById('inviteBtn')?.addEventListener('click', () => this.openInviteModal());
        document.getElementById('closeInviteBtn')?.addEventListener('click', () => this.closeInviteModal());
        document.getElementById('copyLinkBtn')?.addEventListener('click', () => this.copyShareLink());
        document.getElementById('sendInviteBtn')?.addEventListener('click', () => this.sendInvite());

        // File upload (optional)
        document.getElementById('uploadAssetBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
        document.getElementById('fileInput')?.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    selectTool(tool) {
        this.selectedTool = tool;
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tool-btn[data-tool="${tool}"]`)?.classList.add('active');
    }

    zoom(factor) {
        this.canvasState.zoom = Math.max(0.1, Math.min(5, this.canvasState.zoom * factor));
        document.getElementById('zoomLevel').textContent = `${Math.round(this.canvasState.zoom * 100)}%`;
        this.renderCanvas();
    }

    zoomToFit() {
        this.canvasState.zoom = 1;
        this.canvasState.panX = 0;
        this.canvasState.panY = 0;
        document.getElementById('zoomLevel').textContent = '100%';
        this.renderCanvas();
    }

    async saveProject() {
        try {
            await api.updateProject(this.projectId, {
                canvasState: this.canvasState
            });

            document.getElementById('lastSaved').textContent = `Last Saved: Just now`;
            this.showToast('Saved successfully', 'success');
        } catch (error) {
            this.showToast('Save failed', 'error');
        }
    }

    deleteSelectedObjects() {
        if (this.selectedObjects.length === 0) return;

        this.canvasState.objects = this.canvasState.objects.filter(
            o => !this.selectedObjects.includes(o.id)
        );

        if (this.socket && this.isConnected) {
            this.selectedObjects.forEach(id => {
                this.socket.emit('canvas-update', {
                    type: 'object-delete',
                    objectId: id
                });
            });
        }

        this.selectedObjects = [];
        this.renderCanvas();
        this.updateObjectsList();
    }

    setupPanels() {
        // Panel tabs
        const tabs = document.querySelectorAll('.panel-tab');
        if (tabs.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    const panelId = tab.dataset.panel + 'Panel';
                    document.querySelectorAll('.panel-content > div').forEach(p => p.style.display = 'none');
                    const panel = document.getElementById(panelId);
                    if (panel) panel.style.display = 'block';
                });
            });
        }

        this.updateObjectsList();
        this.loadAssets();
    }

    updateObjectsList() {
        const list = document.getElementById('objectsList');
        if (!list) return;

        if (this.canvasState.objects.length === 0) {
            list.innerHTML = '<li class="text-muted" style="padding: var(--spacing-md); text-align: center;">No objects</li>';
            return;
        }

        list.innerHTML = this.canvasState.objects.map(obj => `
      <li class="object-item ${this.selectedObjects.includes(obj.id) ? 'selected' : ''}" data-id="${obj.id}">
        <span class="object-icon">${this.getObjectIcon(obj.type)}</span>
        <span class="object-name">${obj.type} ${obj.id.slice(-4)}</span>
        <span class="object-visibility">👁</span>
      </li>
    `).join('');

        list.querySelectorAll('.object-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectedObjects = [item.dataset.id];
                this.updateObjectsList();
                this.renderCanvas();
            });
        });
    }

    getObjectIcon(type) {
        const icons = {
            rectangle: 'crop_square',
            circle: 'radio_button_unchecked',
            line: 'horizontal_rule',
            text: 'title',
            pencil: 'edit'
        };
        const iconName = icons[type] || 'category';
        return `<span class="material-icons-round" style="font-size: 16px;">${iconName}</span>`;
    }

    async loadAssets() {
        const grid = document.getElementById('assetsGrid');
        if (!grid) return;

        try {
            const response = await api.getAssets(this.projectId);
            const assets = response.data?.assets || [];

            if (assets.length === 0) {
                grid.innerHTML = '<div class="text-muted" style="grid-column: 1/-1; text-align: center; padding: var(--spacing-lg);">No assets</div>';
            } else {
                grid.innerHTML = assets.map(asset => `
          <div class="asset-item" data-id="${asset._id}" draggable="true">
            ${asset.type === 'image' ? `<img src="${asset.url}" alt="${asset.name}">` : `<div style="display: flex; align-items: center; justify-content: center; height: 100%;"><span class="material-icons-round" style="font-size: 24px;">description</span></div>`}
          </div>
        `).join('');
            }
        } catch (error) {
            grid.innerHTML = '<div class="text-muted" style="grid-column: 1/-1; text-align: center;">Failed to load assets</div>';
        }
    }

    async handleFileUpload(e) {
        const files = e.target.files;
        if (!files.length) return;

        for (const file of files) {
            try {
                await api.uploadAsset(this.projectId, file);
                this.showToast(`${file.name} uploaded successfully`, 'success');
            } catch (error) {
                this.showToast(`${file.name} upload failed`, 'error');
            }
        }

        this.loadAssets();
        e.target.value = '';
    }

    async loadVersions() {
        const list = document.getElementById('versionList');

        try {
            const response = await api.getVersions(this.projectId, { limit: 10 });
            const versions = response.data?.versions || [];

            list.innerHTML = versions.map(v => `
        <div class="version-item" data-id="${v._id}">
          <img src="${v.createdBy?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}" class="avatar" alt="">
          <div class="version-info">
            <div class="version-name">${v.name}</div>
            <div class="version-meta">${v.createdBy?.name || 'Unknown'} · ${this.formatTimeAgo(v.createdAt)}</div>
          </div>
        </div>
      `).join('');

            list.querySelectorAll('.version-item').forEach(item => {
                item.addEventListener('click', () => this.restoreVersion(item.dataset.id));
            });
        } catch (error) {
            list.innerHTML = '<div class="text-muted" style="padding: var(--spacing-md); text-align: center;">Failed to load versions</div>';
        }
    }

    async createVersion() {
        const name = prompt('Enter version name:', `Version ${new Date().toLocaleString()}`);
        if (!name) return;

        try {
            await api.createVersion(this.projectId, { name });
            this.showToast('Version saved', 'success');
            this.loadVersions();
        } catch (error) {
            this.showToast('Failed to save version', 'error');
        }
    }

    async restoreVersion(versionId) {
        if (!confirm('Are you sure you want to restore this version? Current changes will be automatically saved.')) return;

        try {
            await api.restoreVersion(this.projectId, versionId);
            this.showToast('Version restored', 'success');
            this.loadProject();
        } catch (error) {
            this.showToast('Restore failed', 'error');
        }
    }

    toggleVersionPanel() {
        document.getElementById('versionPanel').classList.toggle('active');
    }

    toggleChatPanel() {
        document.getElementById('chatPanel').classList.toggle('active');
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();

        if (!text || !this.socket) return;

        this.socket.emit('chat-message', { text });
        input.value = '';
    }

    addChatMessage(message) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const el = document.createElement('div');
        el.className = `chat-message ${message.isSystem ? 'system-message' : ''}`;

        if (message.isSystem) {
            el.style.justifyContent = 'center';
            el.style.padding = '8px';
            el.innerHTML = `<span style="background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; color: var(--text-muted);">${message.message}</span>`;
        } else {
            el.innerHTML = `
                <img src="${message.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}" class="avatar" alt="">
                <div class="message-content">
                    <div class="message-author">${message.name}</div>
                    <div class="message-text">${message.message}</div>
                </div>
            `;
        }
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }

    async openInviteModal() {
        document.getElementById('inviteModal').classList.add('active');
        await this.generateShareLink();
        this.loadMembers();
    }

    closeInviteModal() {
        document.getElementById('inviteModal').classList.remove('active');
    }

    async generateShareLink() {
        try {
            const response = await api.generateShareLink(this.projectId, 'editor');
            document.getElementById('shareLink').value = response.data.shareLink;
        } catch (error) {
            document.getElementById('shareLink').value = window.location.href;
        }
    }

    copyShareLink() {
        const input = document.getElementById('shareLink');
        input.select();
        document.execCommand('copy');
        this.showToast('Link copied to clipboard!', 'success');
    }

    async sendInvite() {
        const email = document.getElementById('inviteEmail').value.trim();
        const role = document.getElementById('inviteRole').value;

        if (!email) {
            this.showToast('Please enter an email', 'warning');
            return;
        }

        try {
            await api.inviteToProject(this.projectId, email, role);
            this.showToast('Invitation sent!', 'success');
            document.getElementById('inviteEmail').value = '';
            this.loadMembers();
        } catch (error) {
            this.showToast(error.message || 'Invitation failed', 'error');
        }
    }

    async loadMembers() {
        const list = document.getElementById('memberList');

        try {
            const response = await api.getMembers(this.projectId);
            const members = response.data?.members || [];

            list.innerHTML = members.map(m => `
        <div class="member-item">
          <img src="${m.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}" class="avatar" alt="" referrerpolicy="no-referrer" style="object-fit: cover;">
          <div class="member-info">
            <div class="member-name">${m.userId?.name || 'Unknown'} ${m.role === 'owner' ? '👑' : ''}</div>
            <div class="member-email">${m.userId?.email || ''}</div>
          </div>
          ${m.role !== 'owner' ? `
            <select class="role-select" onchange="collab.updateMemberRole('${m.userId?._id}', this.value)">
              <option value="editor" ${m.role === 'editor' ? 'selected' : ''}>Editor</option>
              <option value="viewer" ${m.role === 'viewer' ? 'selected' : ''}>Viewer</option>
            </select>
          ` : '<span class="badge badge-primary">Owner</span>'}
        </div>
      `).join('');
        } catch (error) {
            list.innerHTML = '<div class="text-muted">Failed to load members</div>';
        }
    }

    async updateMemberRole(userId, role) {
        try {
            await api.updateMember(this.projectId, userId, role);
            this.showToast('Permissions updated', 'success');
        } catch (error) {
            this.showToast('Failed to update permissions', 'error');
            this.loadMembers();
        }
    }

    updateCollaboratorsUI() {
        const container = document.getElementById('collaborators') || document.getElementById('collaboration-users');
        if (!container) return; // Exit if no container found

        const users = Array.from(this.collaborators.values());

        if (users.length === 0) {
            container.innerHTML = '<span class="material-icons-round" style="font-size: 24px; color: var(--text-muted); opacity: 0.5;">group</span>';
            return;
        }

        container.innerHTML = users.slice(0, 5).map(user => `
            <div class="collaborator-avatar" title="${user.name}" style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 2px solid ${this.getUserColor(user.userId)}; margin-left: -8px; position: relative; z-index: 1;">
                <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.userId}" referrerpolicy="no-referrer" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `).join('') + (users.length > 5 ? `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; margin-left: -8px; border: 1px solid var(--border-color); z-index: 0;">+${users.length - 5}</div>` : '');

        // Ensure flex layout
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.paddingLeft = '8px';
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connectionIndicator');
        const text = document.getElementById('connectionText');

        if (connected) {
            indicator.classList.remove('disconnected');
            text.textContent = 'Connected';
        } else {
            indicator.classList.add('disconnected');
            text.textContent = 'Disconnected';
        }
    }

    formatTimeAgo(date) {
        const now = new Date();
        const d = new Date(date);
        const diff = now - d;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return d.toLocaleDateString('en-US');
    }

    showJoinPopup(user) {
        const popup = document.createElement('div');
        popup.className = 'join-popup';
        popup.innerHTML = `
            <div class="join-popup-content">
                <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}" class="avatar" referrerpolicy="no-referrer">
                <div class="join-info">
                    <span class="user-name">${user.name}</span>
                    <span class="action">has joined the workspace</span>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        // Add CSS for join popup if not exists
        if (!document.getElementById('join-popup-style')) {
            const style = document.createElement('style');
            style.id = 'join-popup-style';
            style.textContent = `
                .join-popup {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 16px;
                    z-index: 10000;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    animation: slideInRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    transition: all 0.3s;
                }
                .join-popup-content { display: flex; align-items: center; gap: 12px; }
                .join-popup .avatar { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--primary); object-fit: cover; }
                .join-info { font-size: 0.95rem; }
                .join-info .user-name { font-weight: 700; color: var(--primary, #0088FF); }
                .join-info .action { color: #CBD5E1; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            popup.style.transform = 'translateX(120%)';
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 500);
        }, 4000);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize
const collab = new CollaborationClient();
