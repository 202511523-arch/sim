import WorkflowNodeTypes from './workflow-nodes.js';

class WorkflowApp {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.isDragging = false;
        this.selectedNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isConnecting = false;
        this.connectionStart = null;
        this.draggedConnection = null;
        this.scale = 1;
        this.token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
        this.projectId = null;
        this.workflowId = null;
        this.lastCursorEmit = 0; // Initialize throttle timestamp

        if (!this.token) {
            window.location.href = '/index.html'; // Redirect to login
            return;
        }

        // Initialize Socket
        try {
            this.socket = io({
                auth: { token: this.token },
                transports: ['websocket', 'polling'] // Force websocket for better performance
            });
            this.setupSocket();
        } catch (e) {
            console.error('Socket.io not initialized:', e);
        }

        // Cache DOM elements
        this.canvas = document.getElementById('node-canvas');
        this.nodesLayer = document.getElementById('nodes-layer');
        this.connectionsLayer = document.getElementById('connections-layer');
        this.propertiesPanel = document.getElementById('properties-panel');
        this.propertiesContent = document.getElementById('properties-content');

        // Modal Elements
        this.modal = document.getElementById('custom-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalConfirmBtn = document.getElementById('modal-confirm-btn');
        this.modalCancelBtn = document.getElementById('modal-cancel-btn');

        this.init();
    }

    async init() {
        console.log('Initializing Workflow App...');

        // Button Listeners
        this.bindButton('new-project-btn', () => this.createNewProject());
        this.bindButton('new-workflow-btn', () => this.createNewWorkflow());
        this.bindButton('open-workflow-btn', () => this.openWorkflow());
        this.bindButton('save-workflow-btn', () => this.saveWorkflow(true));
        this.bindButton('run-workflow-btn', () => this.runWorkflow());
        this.bindButton('share-btn', () => this.shareWorkflow());

        // Delete Node button
        this.bindButton('delete-node-btn', () => this.deleteSelectedNode());

        // Back to list button
        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof window.showWorkflowListView === 'function') {
                    window.showWorkflowListView();
                }
            });
        }

        // Panel Controls
        const closeBtn = document.querySelector('.close-panel-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.propertiesPanel.classList.add('closed');
                this.deselectAll();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Delete or Backspace to delete selected node
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode) {
                // Don't delete if user is typing in an input/textarea
                const tag = document.activeElement?.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
                e.preventDefault();
                this.deleteSelectedNode();
            }
            // Ctrl+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveWorkflow(true);
            }
        });

        // Drag and Drop from Palette
        this.setupPalette();

        // Canvas Interactions
        this.setupCanvas();

        // Global Events
        window.addEventListener('resize', () => this.handleResize());

        // Initial Load
        await this.identifyProject();
        this.loadWorkflowList();

        console.log('Workflow App Initialized.');
    }

    bindButton(id, handler) {
        const btn = document.getElementById(id);
        if (btn) {
            console.log(`Binding button: ${id}`);
            // Use direct onclick to prevent duplicate listeners and avoid cloneNode side effects
            btn.onclick = async (e) => {
                console.log(`Button clicked: ${id}`);
                e.preventDefault();
                // e.stopPropagation(); // Optional: decided to remove to allow bubbling if needed, but keep preventDefault
                try {
                    await handler();
                } catch (err) {
                    console.error(`Error in button handler for ${id}:`, err);
                    // Use a fallback alert if showModal acts up, but try showModal first
                    try {
                        this.showModal('Error', `Action failed: ${err.message}`);
                    } catch (modalErr) {
                        alert(`Action failed: ${err.message}`);
                    }
                }
            };
        } else {
            console.warn(`Button not found: ${id}`);
        }
    }

    // --- Cursor Tracking Methods ---

    getUserColor(userId) {
        const colors = ['#667eea', '#f093fb', '#43e97b', '#f5576c', '#fa709a', '#4facfe'];
        let hash = 0;
        if (userId) {
            for (let i = 0; i < userId.length; i++) {
                hash = userId.charCodeAt(i) + ((hash << 5) - hash);
            }
        }
        return colors[Math.abs(hash) % colors.length];
    }

    updateRemoteCursor(data) {
        const safeUserId = String(data.userId).replace(/[^a-zA-Z0-9]/g, '');

        // Create container if missing
        let container = document.getElementById('workflow-cursor-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'workflow-cursor-container';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '99999';
            document.body.appendChild(container);
        }

        // Ensure cursor exists
        let cursor = document.getElementById(`cursor-${safeUserId}`);
        if (!cursor) {
            const color = this.getUserColor(data.userId); // Use dynamic color
            cursor = document.createElement('div');
            cursor.id = `cursor-${safeUserId}`;
            cursor.className = 'remote-cursor';
            cursor.style.position = 'absolute'; // Absolute within the fixed container
            cursor.style.pointerEvents = 'none';
            cursor.style.transition = 'transform 0.1s linear';
            cursor.style.willChange = 'transform';

            cursor.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L11.7841 12.3673H5.65376Z" fill="${color}" stroke="white" stroke-width="1.5"/>
                </svg>
                <div style="background:${color}; color:white; padding:2px 6px; border-radius:4px; font-size:10px; white-space:nowrap; margin-left:12px; margin-top:-4px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); font-family:sans-serif; font-weight:bold;">${data.userName || 'User'}</div>
            `;
            container.appendChild(cursor);
        }

        // Update position (x,y are client coordinates)
        cursor.style.transform = `translate(${data.x}px, ${data.y}px)`;

        // Timeout to remove inactive cursors
        clearTimeout(cursor.removeTimeout);
        cursor.removeTimeout = setTimeout(() => {
            cursor.remove();
        }, 5000);
    }




    // --- Auth Helper ---
    async authFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) {
            window.location.href = '/index.html';
            throw new Error('Unauthorized');
        }
        return res;
    }

    // --- Modal Helper ---
    showModal(title, content, isConfirm = false, customActions = null) {
        return new Promise((resolve) => {
            if (!this.modal) {
                console.error('Modal element not found!');
                return resolve(false);
            }

            this.modalTitle.innerText = title;
            this.modalMessage.innerHTML = content;
            this.modal.style.display = 'flex';

            // Force reflow for transition
            this.modal.offsetHeight;
            this.modal.classList.add('active');

            // Reset buttons visibility
            this.modalCancelBtn.style.display = isConfirm ? 'block' : 'none';
            this.modalConfirmBtn.style.display = 'block';

            // Cleanup helper to run when closing
            const cleanup = () => {
                this.modal.classList.remove('active');
                setTimeout(() => {
                    this.modal.style.display = 'none';
                    this.modalConfirmBtn.onclick = null;
                    this.modalCancelBtn.onclick = null;
                }, 300); // Wait for transition
            };

            // Bind new handlers
            this.modalConfirmBtn.onclick = () => {
                cleanup();
                resolve(true); // Confirmed
            };

            this.modalCancelBtn.onclick = () => {
                cleanup();
                resolve(false); // Cancelled
            };

            // Close on overlay click (optional, but good UX)
            this.modal.onclick = (e) => {
                if (e.target === this.modal) {
                    cleanup();
                    resolve(false);
                }
            };
        });
    }

    setupSocket() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected');
            if (this.workflowId) {
                this.socket.emit('workflow:join', this.workflowId);
            }
        });

        this.socket.on('disconnect', () => console.log('Socket disconnected'));

        this.socket.on('workflow:node:add', (node) => this.addRemoteNode(node));
        this.socket.on('workflow:node:update', (data) => this.updateRemoteNode(data));
        this.socket.on('workflow:node:delete', (id) => this.deleteRemoteNode(id));
        this.socket.on('workflow:connection:add', (conn) => this.addRemoteConnection(conn));
        this.socket.on('workflow:connection:delete', (id) => this.deleteRemoteConnection(id));
        this.socket.on('workflow:node:doc-update', (data) => this.updateNodeDoc(data));

        // Use centralized WorkspaceCollaboration for cursor and presence
        /*
        // Remote Cursor
        this.socket.on('workflow:cursor', (data) => {
            this.updateRemoteCursor(data);
        });

        // Presence
        this.socket.on('workflow:user-joined', (user) => {
            this.handleUserJoin(user);
            // Re-broadcast my cursor so they see me immediately
            if (this.lastMouseX && this.lastMouseY) {
                this.broadcastCursor({ clientX: this.lastMouseX, clientY: this.lastMouseY });
            }
        });
        this.socket.on('workflow:user-left', (data) => this.handleUserLeave(data));
        this.socket.on('workflow:room-users', (users) => this.updateOnlineUsers(users));
        */

        this.onlineUsers = new Map();
    }

    // --- Presence ---

    handleUserJoin(user) {
        console.log('User joined:', user.name);
        this.onlineUsers.set(user.userId, user);
        this.renderOnlineUsers();

        // Show notification (Moved to Bottom Right)
        const toast = document.createElement('div');
        toast.className = 'toast toast-info';
        toast.innerText = `${user.name} joined`;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px'; // Bottom Right
        toast.style.zIndex = '10000';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    handleUserLeave(data) {
        console.log('User left:', data.userId);
        this.onlineUsers.delete(data.userId);
        this.renderOnlineUsers();

        // Remove cursor
        const cursor = document.getElementById(`cursor-${data.userId}`);
        if (cursor) cursor.remove();
    }

    updateOnlineUsers(users) {
        console.log('Online users:', users);
        this.onlineUsers.clear();
        users.forEach(u => this.onlineUsers.set(u.userId, u));
        this.renderOnlineUsers();
    }

    renderOnlineUsers() {
        let container = document.getElementById('online-users-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'online-users-container';
            container.style.position = 'absolute';
            container.style.top = '16px';
            container.style.right = '240px';
            container.style.display = 'flex';
            container.style.gap = '-8px';
            container.style.zIndex = '100';
            const header = document.querySelector('.header');
            if (header) header.appendChild(container);
            else document.body.appendChild(container); // Fallback
        }

        container.innerHTML = '';

        Array.from(this.onlineUsers.values()).forEach((user, index) => {
            if (index > 4) return; // Limit display
            const avatar = document.createElement('div');
            avatar.title = user.name;
            avatar.style.width = '32px';
            avatar.style.height = '32px';
            avatar.style.borderRadius = '50%';
            avatar.style.background = '#3B82F6';
            avatar.style.border = '2px solid #1e293b';
            avatar.style.color = 'white';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.fontSize = '12px';
            avatar.style.fontWeight = 'bold';
            avatar.style.marginLeft = index > 0 ? '-8px' : '0';
            avatar.style.cursor = 'default';
            avatar.innerText = user.name.substring(0, 2).toUpperCase();
            container.appendChild(avatar);
        });
    }



    setupCanvas() {
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.target === this.canvas || e.target === this.activeLayer || e.target === this.nodesLayer) {
                this.deselectAll();
            }
        });

        // Use document for mousemove to catch all movements
        document.addEventListener('mousemove', (e) => {
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            // Handle internal move (dragging nodes etc)
            try {
                this.handleMouseMove(e);
            } catch (err) {
                console.error('HandleMouseMove failed', err);
            }
        });
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    broadcastCursor(e) {
        if (!this.socket || !this.workflowId) return;

        // Throttle
        const now = Date.now();
        if (now - (this.lastCursorEmit || 0) < 50) return; // 20fps cap
        this.lastCursorEmit = now;

        // Send raw Client coordinates (screen space)
        const x = e.clientX;
        const y = e.clientY;

        this.socket.emit('workflow:cursor', { x, y });
    }
    async identifyProject() {
        try {
            const res = await this.authFetch('/api/projects?limit=1');
            const data = await res.json();
            if (data.success && data.data.projects.length > 0) {
                this.projectId = data.data.projects[0]._id;
                console.log('Using project:', this.projectId);
            } else {
                console.warn('No projects found');
            }
        } catch (e) {
            console.error('Failed to identify project', e);
        }
    }

    async loadWorkflowList() {
        if (!this.projectId) return;

        try {
            const res = await this.authFetch(`/api/workflow/project/${this.projectId}/list`);
            const data = await res.json();
            if (data.success) {
                this.availableWorkflows = data.data;

                // Check URL for workflow ID
                const urlParams = new URLSearchParams(window.location.search);
                const urlWorkflowId = urlParams.get('id');

                if (urlWorkflowId) {
                    console.log('Loading workflow from URL:', urlWorkflowId);
                    this.loadWorkflow(urlWorkflowId);
                } else {
                    // Show list view instead of auto-loading first workflow
                    if (typeof window.showWorkflowListView === 'function') {
                        window.showWorkflowListView();
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load list', e);
        }
    }

    async loadWorkflow(id) {
        try {
            const res = await this.authFetch(`/api/workflow/${id}`);
            const data = await res.json();
            if (data.success) {
                const wf = data.data;

                if (this.workflowId && this.socket) {
                    this.socket.emit('workflow:leave', this.workflowId);
                }

                this.workflowId = wf._id;

                this.nodes = [];
                this.connections = [];
                this.nodesLayer.innerHTML = '';
                this.connectionsLayer.innerHTML = '';

                // Update title in header save button area
                const saveText = document.getElementById('save-status-text');
                if (saveText) saveText.textContent = 'Save';

                if (wf.nodes) wf.nodes.forEach(n => this.addNode(n.type, n.x, n.y, true, n.id, n.data, n.documentation));
                if (wf.connections) wf.connections.forEach(c => this.addConnection(c, true));

                if (this.socket) {
                    this.socket.emit('workflow:join', this.workflowId);
                }

                // Hide the list view and show the editor
                if (typeof window.hideWorkflowListView === 'function') {
                    window.hideWorkflowListView();
                }

                // Update URL to reflect current workflow
                const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?id=${this.workflowId}`;
                window.history.pushState({ path: newUrl }, '', newUrl);

                // Update page title
                document.title = `${wf.name} - SIMVEX Workflow`;
            }
        } catch (e) {
            console.error('Failed to load workflow', e);
        }
    }

    async saveWorkflow(manual = false) {
        if (!this.workflowId || this.workflowId.startsWith('workflow-')) {
            if (manual) this.showModal('Error', 'Cannot save. No valid workflow ID.');
            return;
        }

        // Ensure nodes/data are plain objects
        const nodesPayload = this.nodes.map(n => ({
            id: n.id,
            type: n.type,
            x: n.x,
            y: n.y,
            data: n.data || {},
            documentation: n.documentation || ''
        }));

        const payload = {
            nodes: nodesPayload,
            connections: this.connections,
            name: document.title.replace(' - SIMVEX Workflow', '') || 'Untitled Workflow'
        };

        try {
            const res = await this.authFetch(`/api/workflow/${this.workflowId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Server returned error');
            }

            const status = document.getElementById('save-status-text');
            if (status) status.innerText = 'Saved \u2713';

            if (manual) this.showModal('Saved', 'Workflow saved successfully!');
        } catch (e) {
            console.error('Save failed', e);
            if (manual) this.showModal('Error', 'Failed to save workflow: ' + e.message);
        }
    }

    async createNewProject() {
        const html = `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <label for="new-project-name" style="font-size:12px; color:#cbd5e1;">Project Name</label>
                <input id="new-project-name" type="text" value="New Experiment" class="input" style="background:#0f172a; border:1px solid #475569; padding:8px; border-radius:6px; color:white;">
                
                <label for="new-project-category" style="font-size:12px; color:#cbd5e1;">Category</label>
                <select id="new-project-category" class="input" style="background:#0f172a; border:1px solid #475569; padding:8px; border-radius:6px; color:white;">
                    <option value="chemistry">Chemistry</option>
                    <option value="biology">Biology</option>
                    <option value="engineering">Engineering</option>
                    <option value="earthscience">Earth Science</option>
                    <option value="medical">Medical</option>
                </select>
            </div>
        `;

        const confirm = await this.showModal('Create New Project', html, true);
        if (!confirm) return;

        // Retrieve values from the modal-message container specifically
        const nameInput = document.getElementById('new-project-name');
        const catInput = document.getElementById('new-project-category');

        const name = nameInput ? nameInput.value : 'Untitled Project';
        const category = catInput ? catInput.value : 'chemistry';

        try {
            const res = await this.authFetch('/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name, category, description: 'Created from Workflow Editor' })
            });
            const data = await res.json();

            if (data.success) {
                this.projectId = data.data.project._id;
                console.log('Created project:', this.projectId);

                // Now create a default workflow for this project
                await this.createNewWorkflow(true, 'Initial Workflow');
                this.showModal('Success', 'Project and Workflow created successfully!');
            } else {
                this.showModal('Error', data.message || 'Failed to create project');
            }
        } catch (e) {
            this.showModal('Error', 'Failed to create project: ' + e.message);
        }
    }

    async createNewWorkflow(silent = false, nameOverride = null) {
        if (!silent) {
            const confirm = await this.showModal('Create New Workflow', 'Create new workflow? Unsaved changes will be lost.', true);
            if (!confirm) return;
        }

        const name = nameOverride || ('Untitled Workflow ' + new Date().toLocaleDateString());

        if (!this.projectId) {
            this.showModal('Error', 'No project selected. Please create a project first.');
            return;
        }

        try {
            const res = await this.authFetch('/api/workflow', {
                method: 'POST',
                body: JSON.stringify({ name, projectId: this.projectId })
            });
            const data = await res.json();
            if (data.success) {
                this.loadWorkflow(data.data._id);
            } else {
                this.showModal('Error', data.message || 'Failed to create workflow');
            }
        } catch (e) {
            console.error('Create failed', e);
            this.showModal('Error', 'Failed to create workflow: ' + e.message);
        }
    }

    async openWorkflow() {
        // Show the list view instead of a modal
        if (typeof window.showWorkflowListView === 'function') {
            window.showWorkflowListView();
        }
    }

    runWorkflow() {
        const btn = document.getElementById('run-workflow-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="material-icons-round">hourglass_empty</span> Running...';
            btn.disabled = true;

            this.executeGraph().then(results => {
                console.log('Execution Results:', results);
                btn.innerHTML = originalText;
                btn.disabled = false;
                this.showModal('Execution Complete', `Workflow executed!\n\nProcessed ${results.steps} steps.\nCheck console for details.`);
            });
        } else {
            this.executeGraph().then(results => {
                console.log('Execution Results:', results);
                this.showModal('Execution Complete', `Workflow executed!\n\nProcessed ${results.steps} steps.\nCheck console for details.`);
            });
        }
    }

    async executeGraph() {
        const results = {};
        const queue = this.nodes.filter(n => n.type.startsWith('input-'));
        let steps = 0;

        if (queue.length === 0 && this.nodes.length > 0) {
            const targets = new Set(this.connections.map(c => c.target));
            this.nodes.forEach(n => {
                if (!targets.has(n.id)) queue.push(n);
            });
        }

        while (queue.length > 0) {
            const node = queue.shift();
            if (results[node.id]) continue;

            steps++;
            const output = await this.executeNode(node, results);
            results[node.id] = output;

            const outgoing = this.connections.filter(c => c.source === node.id);
            outgoing.forEach(conn => {
                const target = this.nodes.find(n => n.id === conn.target);
                if (target) queue.push(target);
            });
        }

        this.saveWorkflow();
        return { steps, results };
    }

    async executeNode(node, context) {
        console.log(`Executing ${node.type} (${node.id})...`);
        const statusEl = document.getElementById(node.id);
        if (statusEl) {
            statusEl.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
            setTimeout(() => statusEl.style.boxShadow = '', 1000);
        }

        await new Promise(r => setTimeout(r, 500));

        if (node.type === 'input-data') return { data: [1, 2, 3, 4, 5], source: 'csv' };
        if (node.type === 'process-filter') return { filtered: [3, 4, 5] };
        if (node.type === 'process-script') return { result: 'Script Executed' };
        if (node.type === 'output-chart') return { chart: 'Rendered' };

        return { status: 'done' };
    }

    shareWorkflow() {
        if (this.workflowId) {
            const url = `${window.location.origin}${window.location.pathname}?id=${this.workflowId}`;
            navigator.clipboard.writeText(url);
            this.showModal('Share', 'Shareable link copied to clipboard!<br><br><span style="font-size:12px; color:#94a3b8;">' + url + '</span>');
        }
    }

    // --- Palette Dragging ---

    setupPalette() {
        const items = document.querySelectorAll('.draggable-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', item.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });
    }

    // --- Canvas Interactions (Drag & Drop) ---
    // Note: Primary canvas event handling is in setupCanvas() above (line 364)

    handleDrop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        if (!type || !WorkflowNodeTypes[type]) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - (this.nodesLayer.offsetParent ? this.nodesLayer.offsetParent.scrollLeft : 0);
        const y = e.clientY - rect.top - (this.nodesLayer.offsetParent ? this.nodesLayer.offsetParent.scrollTop : 0);

        this.addNode(type, e.clientX - rect.left, e.clientY - rect.top);
    }

    // --- Node Management ---

    addNode(type, x, y, remote = false, id = null, data = {}, documentation = '') {
        const config = WorkflowNodeTypes[type];
        const node = {
            id: id || `node-${Date.now()}`,
            type: type,
            x: x,
            y: y,
            data: data || {},
            documentation: documentation || '',
            inputs: config.inputs || [],
            outputs: config.outputs || []
        };

        this.nodes.push(node);
        this.renderNode(node);

        if (!remote && this.socket) {
            this.socket.emit('workflow:node:add', node);
        }

        if (!remote) this.saveWorkflow();
    }

    renderNode(node) {
        const config = WorkflowNodeTypes[node.type];
        const el = document.createElement('div');
        el.className = 'workflow-node';
        el.id = node.id;
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;

        let inputs = '';
        if (node.inputs.length) {
            inputs = `<div class="node-ports-in">${node.inputs.map(p => `<div class="port input-port" data-port="${p}" title="${p}"></div>`).join('')}</div>`;
        }
        let outputs = '';
        if (node.outputs.length) {
            outputs = `<div class="node-ports-out">${node.outputs.map(p => `<div class="port output-port" data-port="${p}" title="${p}"></div>`).join('')}</div>`;
        }

        el.innerHTML = `
            <div class="node-header" data-category="${config.category}">
                <span class="workflow-node-title">${config.label}</span>
                <span class="material-icons-round node-icon">${config.icon}</span>
            </div>
            <div class="node-body">
                ${inputs}
                <div style="flex:1"></div>
                ${outputs}
            </div>
        `;

        const header = el.querySelector('.node-header');
        header.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDragging(e, node);
        });

        el.querySelectorAll('.port').forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (port.classList.contains('output-port')) {
                    this.startConnecting(e, node, port);
                }
            });
            port.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                if (this.isConnecting && port.classList.contains('input-port')) {
                    this.finishConnecting(node, port);
                }
            });
        });

        el.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });

        this.nodesLayer.appendChild(el);
    }

    // --- Interaction Logic ---

    startDragging(e, node) {
        this.isDragging = true;
        this.selectedNode = node;
        this.dragOffset = {
            x: e.clientX - node.x,
            y: e.clientY - node.y
        };
        this.selectNode(node);
        document.body.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedNode) {
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;

            this.selectedNode.x = x;
            this.selectedNode.y = y;

            const el = document.getElementById(this.selectedNode.id);
            if (el) {
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                this.updateConnections(this.selectedNode.id);
            }

            if (this.socket) {
                this.socket.emit('workflow:node:update', {
                    id: this.selectedNode.id,
                    x: x,
                    y: y
                });
            }
        }

        if (this.isConnecting) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const d = `M ${this.connectionStart.x} ${this.connectionStart.y} C ${this.connectionStart.x + 50} ${this.connectionStart.y} ${mouseX - 50} ${mouseY} ${mouseX} ${mouseY}`;
            if (this.draggedConnection) {
                this.draggedConnection.setAttribute('d', d);
            }
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            document.body.style.cursor = 'default';
            this.saveWorkflow();
        }
        if (this.isConnecting) {
            this.isConnecting = false;
            if (this.draggedConnection) {
                this.draggedConnection.remove();
                this.draggedConnection = null;
            }
        }
    }

    // --- Connections ---

    startConnecting(e, node, port) {
        this.isConnecting = true;

        const rect = port.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();

        const startX = rect.left - canvasRect.left + rect.width / 2;
        const startY = rect.top - canvasRect.top + rect.height / 2;

        this.connectionStart = {
            nodeId: node.id,
            port: port.dataset.port,
            x: startX,
            y: startY
        };

        this.draggedConnection = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.draggedConnection.setAttribute('class', 'connection-path dragged');
        this.connectionsLayer.appendChild(this.draggedConnection);
    }

    finishConnecting(targetNode, targetPort) {
        if (!this.connectionStart) return;
        if (this.connectionStart.nodeId === targetNode.id) return;

        const connection = {
            id: `conn-${Date.now()}`,
            source: this.connectionStart.nodeId,
            sourcePort: this.connectionStart.port,
            target: targetNode.id,
            targetPort: targetPort.dataset.port
        };

        this.addConnection(connection);
    }

    addConnection(conn, remote = false) {
        this.connections.push(conn);
        this.renderConnection(conn);
        if (!remote && this.socket) {
            this.socket.emit('workflow:connection:add', conn);
        }
        if (!remote) this.saveWorkflow();
    }

    renderConnection(conn) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'connection-path');
        path.id = conn.id;
        this.connectionsLayer.appendChild(path);
        this.updateConnectionPath(conn);

        path.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.deleteConnection(conn.id);
        });
    }

    updateConnections(nodeId) {
        this.connections
            .filter(c => c.source === nodeId || c.target === nodeId)
            .forEach(c => this.updateConnectionPath(c));
    }

    updateConnectionPath(conn) {
        const sourceNode = this.nodes.find(n => n.id === conn.source);
        const targetNode = this.nodes.find(n => n.id === conn.target);
        if (!sourceNode || !targetNode) return;

        const sourceEl = document.getElementById(conn.source);
        const targetEl = document.getElementById(conn.target);
        if (!sourceEl || !targetEl) return;

        const sourcePort = sourceEl.querySelector(`.output-port[data-port="${conn.sourcePort}"]`);
        const targetPort = targetEl.querySelector(`.input-port[data-port="${conn.targetPort}"]`);
        if (!sourcePort || !targetPort) return;

        const canvasRect = this.canvas.getBoundingClientRect();
        const sRect = sourcePort.getBoundingClientRect();
        const tRect = targetPort.getBoundingClientRect();

        const x1 = sRect.left - canvasRect.left + sRect.width / 2;
        const y1 = sRect.top - canvasRect.top + sRect.height / 2;
        const x2 = tRect.left - canvasRect.left + tRect.width / 2;
        const y2 = tRect.top - canvasRect.top + tRect.height / 2;

        const midX = (x1 + x2) / 2;
        const d = `M ${x1} ${y1} C ${midX} ${y1} ${midX} ${y2} ${x2} ${y2}`;

        const el = document.getElementById(conn.id);
        if (el) el.setAttribute('d', d);
    }

    deleteConnection(id, remote = false) {
        const idx = this.connections.findIndex(c => c.id === id);
        if (idx > -1) {
            this.connections.splice(idx, 1);
            const el = document.getElementById(id);
            if (el) el.remove();

            if (!remote && this.socket) {
                this.socket.emit('workflow:connection:delete', id);
            }
            if (!remote) this.saveWorkflow();
        }
    }

    // --- Selection & Properties ---

    selectNode(node) {
        this.deselectAll();
        this.selectedNode = node;
        const el = document.getElementById(node.id);
        if (el) el.classList.add('selected');

        this.showProperties(node);
    }

    deselectAll() {
        this.selectedNode = null;
        document.querySelectorAll('.workflow-node.selected').forEach(el => el.classList.remove('selected'));
        this.propertiesPanel.classList.add('closed');
    }

    deleteSelectedNode() {
        if (!this.selectedNode) return;
        this.deleteNode(this.selectedNode.id);
    }

    deleteNode(id, remote = false) {
        const idx = this.nodes.findIndex(n => n.id === id);
        if (idx === -1) return;

        // Remove related connections
        const relatedConns = this.connections.filter(c => c.source === id || c.target === id);
        relatedConns.forEach(c => this.deleteConnection(c.id, remote));

        // Animate then remove the node
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('deleting');
            setTimeout(() => el.remove(), 300);
        }

        this.nodes.splice(idx, 1);

        // Deselect
        if (this.selectedNode && this.selectedNode.id === id) {
            this.deselectAll();
        }

        // Broadcast
        if (!remote && this.socket) {
            this.socket.emit('workflow:node:delete', id);
        }
        if (!remote) this.saveWorkflow();
    }

    showProperties(node) {
        this.propertiesPanel.classList.remove('closed');
        const config = WorkflowNodeTypes[node.type];

        let html = `
            <div class="prop-group" style="padding: 10px 0;">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px;">Node Type</div>
                <div style="font-weight: 600; font-size: 16px;">${config.label}</div>
            </div>
            <div class="prop-group" style="padding: 10px 0; border-bottom: 1px solid #334155;">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px;">ID</div>
                <div style="font-family: monospace; font-size: 12px; color: #64748b;">${node.id}</div>
            </div>
        `;

        if (config.properties) {
            config.properties.forEach(prop => {
                html += `<div style="margin-top: 15px;">
                    <label style="display:block; margin-bottom: 5px; font-size: 12px; color: #cbd5e1;">${prop.label}</label>`;

                if (prop.type === 'select') {
                    html += `<select class="prop-input" data-key="${prop.name}" style="width:100%; padding: 8px; background: #334155; border:1px solid #475569; color:white; border-radius:4px;">
                        ${prop.options.map(o => `<option value="${o}" ${node.data[prop.name] === o ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>`;
                } else if (prop.type === 'textarea') {
                    html += `<textarea class="prop-input" data-key="${prop.name}" style="width:100%; padding: 8px; background: #334155; border:1px solid #475569; color:white; border-radius:4px; min-height: 80px;">${node.data[prop.name] || ''}</textarea>`;
                } else {
                    html += `<input class="prop-input" type="${prop.type === 'number' ? 'number' : 'text'}" data-key="${prop.name}" value="${node.data[prop.name] || ''}" style="width:100%; padding: 8px; background: #334155; border:1px solid #475569; color:white; border-radius:4px;">`;
                }
                html += `</div>`;
            });
        }

        html += `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #334155;">
                <label style="display:block; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #3b82f6;">
                    <span class="material-icons-round" style="font-size: 14px; vertical-align: middle; margin-right: 4px;">description</span>
                    Documentation / Notes
                </label>
                <textarea id="node-doc-input" style="width: 100%; height: 150px; padding: 10px; background: #0f172a; border: 1px solid #475569; color: #e2e8f0; border-radius: 6px; line-height: 1.5; font-size: 13px; resize: vertical;" placeholder="Write documentation, notes, or usage instructions for this step...">${node.documentation || ''}</textarea>
            </div>
        `;

        this.propertiesContent.innerHTML = html;

        this.propertiesContent.querySelectorAll('.prop-input').forEach(input => {
            input.addEventListener('change', (e) => {
                node.data[e.target.dataset.key] = e.target.value;
                if (this.socket) {
                    this.socket.emit('workflow:node:update', { id: node.id, data: node.data });
                }
                this.saveWorkflow();
            });
        });

        const docInput = document.getElementById('node-doc-input');
        if (docInput) {
            docInput.addEventListener('input', (e) => {
                node.documentation = e.target.value;
                if (this.socket) {
                    this.socket.emit('workflow:node:doc-update', { id: node.id, documentation: node.documentation });
                }
                this.saveWorkflow();
            });
        }
    }

    // --- Remote Handlers ---

    addRemoteNode(node) {
        if (!this.nodes.find(n => n.id === node.id)) {
            this.addNode(node.type, node.x, node.y, true, node.id, node.data, node.documentation);
        }
    }

    updateRemoteNode(data) {
        const node = this.nodes.find(n => n.id === data.id);
        if (node) {
            if (data.x !== undefined) node.x = data.x;
            if (data.y !== undefined) node.y = data.y;
            if (data.data) node.data = { ...node.data, ...data.data };

            const el = document.getElementById(node.id);
            if (el) {
                el.style.left = `${node.x}px`;
                el.style.top = `${node.y}px`;
                this.updateConnections(node.id);
            }
        }
    }

    deleteRemoteNode(id) {
        const idx = this.nodes.findIndex(n => n.id === id);
        if (idx > -1) {
            this.nodes.splice(idx, 1);
            const el = document.getElementById(id);
            if (el) el.remove();
            this.updateConnections(id);
        }
    }

    addRemoteConnection(conn) {
        if (!this.connections.find(c => c.id === conn.id)) {
            this.addConnection(conn, true);
        }
    }

    deleteRemoteConnection(id) {
        this.deleteConnection(id, true);
    }

    updateNodeDoc(data) {
        const node = this.nodes.find(n => n.id === data.id);
        if (node) {
            node.documentation = data.documentation;
            if (this.selectedNode && this.selectedNode.id === node.id) {
                const input = document.getElementById('node-doc-input');
                if (input && document.activeElement !== input) {
                    input.value = node.documentation;
                }
            }
        }
    }

    handleResize() { }
}

// Initialize App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.workflowApp = new WorkflowApp();
    });
} else {
    window.workflowApp = new WorkflowApp();
}
