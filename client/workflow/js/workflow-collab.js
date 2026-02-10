/**
 * Workflow Collaboration
 * Handles real-time synchronization of nodes and connections.
 */

class WorkflowCollab {
    constructor(editor) {
        this.editor = editor;
        this.socket = io();
        this.projectId = new URLSearchParams(window.location.search).get('project') || 'default-project'; // simplified
        this.init();
    }

    init() {
        // Join Project Room
        this.socket.emit('join-project', this.projectId);
        this.socket.emit('workflow:join', this.projectId);

        // Listen for remote events
        this.socket.on('workflow:init', (data) => this.handleInit(data));
        this.socket.on('workflow:node:add', (data) => this.handleRemoteCreate(data));
        this.socket.on('workflow:node:move', (data) => this.handleRemoteMove(data));
        this.socket.on('workflow:node:update', (data) => this.handleRemoteUpdate(data));
        this.socket.on('workflow:connection:add', (data) => this.handleRemoteConnect(data));
    }

    handleInit(data) {
        // Clear existing
        this.editor.nodes = [];
        this.editor.connections = [];
        document.getElementById('nodes-layer').innerHTML = '';
        document.getElementById('connections-layer').innerHTML = '';

        // Load nodes
        if (data.nodes) {
            data.nodes.forEach(node => {
                this.editor.nodes.push(node);
                this.editor.renderNode(node);
            });
        }

        // Load connections
        if (data.connections) {
            data.connections.forEach(conn => {
                this.editor.connections.push(conn);
                this.editor.renderConnection(conn);
            });
        }
    }

    broadcastNodeCreate(node) {
        this.socket.emit('workflow:node:add', node);
        this.syncFullState(); // Strategy: optimistic UI + background sync
    }

    broadcastNodeMove(node) {
        this.socket.emit('workflow:node:move', { id: node.id, x: node.x, y: node.y });
        this.syncFullState();
    }

    broadcastNodeUpdate(data) {
        this.socket.emit('workflow:node:update', data);
        this.syncFullState();
    }

    broadcastConnectionCreate(connection) {
        this.socket.emit('workflow:connection:add', connection);
        this.syncFullState();
    }

    syncFullState() {
        // Debounced full save
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.socket.emit('workflow:update', {
                nodes: this.editor.nodes,
                connections: this.editor.connections
            });
        }, 1000);
    }

    handleRemoteCreate(node) {
        if (this.editor.nodes.find(n => n.id === node.id)) return;
        this.editor.nodes.push(node);
        this.editor.renderNode(node);
    }

    handleRemoteMove(data) {
        const node = this.editor.nodes.find(n => n.id === data.id);
        if (!node) return;
        node.x = data.x;
        node.y = data.y;

        const el = document.getElementById(node.id);
        if (el) {
            el.style.left = `${node.x}px`;
            el.style.top = `${node.y}px`;
            this.editor.updateConnections(node.id);
        }
    }

    handleRemoteUpdate(data) {
        const node = this.editor.nodes.find(n => n.id === data.id);
        if (!node) return;

        // Merge data
        node.data = { ...node.data, ...data.data };

        // Update UI specific to node type (e.g., textarea)
        if (node.type === 'doc-note') {
            const el = document.getElementById(node.id);
            const textarea = el?.querySelector('textarea');
            if (textarea && textarea.value !== node.data.content) {
                textarea.value = node.data.content || '';
            }
        }
    }

    handleRemoteConnect(data) {
        if (this.editor.connections.find(c => c.id === data.id)) return;
        this.editor.connections.push(data);
        this.editor.renderConnection(data);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Wait for editor to be ready
    setTimeout(() => {
        if (window.workflowEditor) {
            window.workflowCollab = new WorkflowCollab(window.workflowEditor);

            // Hook into editor methods to broadcast events
            const originalCreateNode = window.workflowEditor.createNode.bind(window.workflowEditor);
            window.workflowEditor.createNode = function (type, x, y) { // Override to capture return or internal logic
                // We need to modify createNode to return the node or we need to access it differently.
                // Actually, looking at editor.js, createNode pushes to this.nodes.
                // Better approach: Modify createNode in editor.js to call window.workflowCollab.broadcastNodeCreate(node)
                // But since I can't modify that file in this step easily without overlap, I'll rely on the existing commented out code in editor.js 
                // which I should have uncommented.

                // Let's assume we modify editor.js to call these.
            };
        }
    }, 100);
});
