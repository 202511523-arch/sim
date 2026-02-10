
/**
 * Workflow Tools & UI Management
 * Handles Floating Action Buttons, Popups, Sticky Notes, and Drawing Tool
 */

class WorkflowTools {
    constructor(app) {
        this.app = app;
        this.stickyNotes = new Map();
        this.drawingInitialized = false;
        this.drawSettings = {
            tool: 'pen',
            color: '#6366f1',
            brushSize: 4,
            opacity: 100
        };
        this.isDrawing = false;
        this.currentStrokePoints = [];
        this.activePopup = null;

        this.init();
    }

    init() {
        // Setup Popup Toggles
        this.bindPopupToggle('fab-chat', 'chat-popup');
        this.bindPopupToggle('fab-notes', 'notes-popup');
        this.bindPopupToggle('fab-sticky', null, () => this.createStickyNote());
        document.getElementById('fab-draw')?.addEventListener('click', () => {
            this.togglePopup('draw-popup');
            if (!this.drawingInitialized) this.initDrawingTool();
        });

        // Initialize external common modules if they exist
        this.initCommonModules();
    }

    bindPopupToggle(btnId, popupId, customAction) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (customAction) {
                customAction();
            } else if (popupId) {
                this.togglePopup(popupId);
            }
        });
    }

    togglePopup(id) {
        const popup = document.getElementById(id);
        if (!popup) return;

        // Close others
        document.querySelectorAll('.popup-panel').forEach(p => {
            if (p.id !== id && p.style.display === 'flex') {
                p.style.display = 'none';
            }
        });

        // Toggle current
        if (popup.style.display === 'flex') {
            popup.style.display = 'none';
            this.activePopup = null;
        } else {
            popup.style.display = 'flex';
            this.activePopup = id;

            // Re-initialize specific logic if needed
            if (id === 'draw-popup' && !this.drawingInitialized) {
                this.initDrawingTool();
            }
        }
    }

    closePopup(id) {
        const popup = document.getElementById(id);
        if (popup) popup.style.display = 'none';
    }

    initCommonModules() {
        // Workspace Chatbot
        if (typeof WorkspaceChatbot !== 'undefined' && !window.chatbot) {
            window.chatbot = new WorkspaceChatbot({
                workspace: 'workflow',
                containerId: 'ai-panel',
                inputId: 'omni-input',
                sendButtonId: 'omni-send',
                projectId: this.app.projectId
            });
        }

        // Workspace Notes
        if (typeof WorkspaceNotes !== 'undefined' && !window.workspaceNotes) {
            window.workspaceNotes = new WorkspaceNotes({
                workspace: 'workflow',
                projectId: this.app.projectId,
                notepadId: 'notepad'
            });

            // Bind header buttons for notes
            document.getElementById('btn-save-note')?.addEventListener('click', () => window.workspaceNotes.manualSave());
            document.getElementById('btn-new-note')?.addEventListener('click', () => window.workspaceNotes.createNewNote());
            document.getElementById('btn-pdf-export')?.addEventListener('click', () => window.workspaceNotes.exportToPDF());
        }
    }

    // ==========================================
    // STICKY NOTES
    // ==========================================

    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    createStickyNote(data = {}) {
        const noteId = data.id || this.generateId();
        const content = data.content || '';
        const x = data.x !== undefined ? data.x : window.innerWidth - 320;
        const y = data.y !== undefined ? data.y : 100 + (this.stickyNotes.size * 30);
        const zIndex = data.zIndex || 1000 + this.stickyNotes.size;

        const noteEl = document.createElement('div');
        noteEl.id = noteId;
        noteEl.className = 'sticky-note-card';
        noteEl.style.left = x + 'px';
        noteEl.style.top = y + 'px';
        noteEl.style.zIndex = zIndex;
        // Make sure it's visible (sticky-note-card class usually has display:flex but check CSS)
        noteEl.style.display = 'flex';

        noteEl.innerHTML = `
            <div class="sticky-note-header">
                <button class="sticky-delete-btn" title="Delete">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
            <textarea placeholder="Quick note...">${content}</textarea>
        `;

        const container = document.getElementById('sticky-notes-container') || document.body;
        container.appendChild(noteEl);

        this.stickyNotes.set(noteId, { content, x, y, zIndex });

        const textarea = noteEl.querySelector('textarea');
        const deleteBtn = noteEl.querySelector('.sticky-delete-btn');

        // Handlers
        textarea.addEventListener('input', () => {
            const note = this.stickyNotes.get(noteId);
            if (note) note.content = textarea.value;

            if (window.workspaceCollaboration) {
                window.workspaceCollaboration.emitStickyNoteUpdate('update', {
                    id: noteId, content: textarea.value
                });
            }
        });

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent focus/drag issues
                noteEl.remove();
                this.stickyNotes.delete(noteId);

                if (window.workspaceCollaboration) {
                    window.workspaceCollaboration.emitStickyNoteUpdate('delete', { id: noteId });
                }
            });
        }

        this.makeDraggable(noteEl, noteId, textarea);

        return noteEl;
    }

    makeDraggable(noteEl, noteId, textarea) {
        let isDragging = false;
        let initialX, initialY;

        noteEl.addEventListener('mousedown', (e) => {
            if (e.target === textarea) return;
            isDragging = true;
            initialX = e.clientX - noteEl.offsetLeft;
            initialY = e.clientY - noteEl.offsetTop;
            noteEl.style.cursor = 'grabbing';
            noteEl.style.zIndex = 1100; // Bring to front
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const currentX = e.clientX - initialX;
            const currentY = e.clientY - initialY;
            noteEl.style.left = currentX + 'px';
            noteEl.style.top = currentY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            noteEl.style.cursor = 'move';
            // Save pos
            const note = this.stickyNotes.get(noteId);
            if (note) {
                note.x = noteEl.offsetLeft;
                note.y = noteEl.offsetTop;

                if (window.workspaceCollaboration) {
                    window.workspaceCollaboration.emitStickyNoteUpdate('move', {
                        id: noteId, x: note.x, y: note.y
                    });
                }
            }
        });
    }

    // ==========================================
    // DRAWING TOOL
    // ==========================================

    initDrawingTool() {
        this.drawingInitialized = true;
        const canvas = document.getElementById('draw-canvas');
        if (!canvas) return;

        this.drawCtx = canvas.getContext('2d', { willReadFrequently: true });

        // Resize
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Toggle visibility handled by popup logic, but pointer events must be enabled
        canvas.style.pointerEvents = 'auto';

        // Listeners
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());

        window.addEventListener('resize', () => {
            const imgData = this.drawCtx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            this.drawCtx.putImageData(imgData, 0, 0);
        });

        // Tool buttons
        document.querySelectorAll('.draw-tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.draw-tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.drawSettings.tool = btn.dataset.tool;
            });
        });

        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.drawSettings.color = btn.dataset.color;
            });
        });

        // Clear button
        document.getElementById('btn-clear-canvas')?.addEventListener('click', () => {
            this.drawCtx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    startDrawing(e) {
        if (!this.drawingInitialized) return;
        this.isDrawing = true;

        // If drawing inside the popup (preview)?? No, draw-canvas is typically full screen overlay
        // In this implementation, draw-canvas is full screen.

        const canvas = document.getElementById('draw-canvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.currentStrokePoints = [{ x, y }]; // Init stroke points

        this.drawCtx.beginPath();
        this.drawCtx.moveTo(x, y);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const canvas = document.getElementById('draw-canvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentStrokePoints) this.currentStrokePoints.push({ x, y });

        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
        this.drawCtx.lineWidth = this.drawSettings.brushSize;
        this.drawCtx.strokeStyle = this.drawSettings.tool === 'eraser' ? '#00000000' : this.drawSettings.color;

        if (this.drawSettings.tool === 'eraser') {
            this.drawCtx.globalCompositeOperation = 'destination-out';
            this.drawCtx.lineWidth = this.drawSettings.brushSize * 4;
        } else {
            this.drawCtx.globalCompositeOperation = 'source-over';
        }

        this.drawCtx.lineTo(x, y);
        this.drawCtx.stroke();

        // Smooth
        this.drawCtx.beginPath();
        this.drawCtx.moveTo(x, y);
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        // Broadcast stroke
        if (this.currentStrokePoints && this.currentStrokePoints.length > 1 && window.workspaceCollaboration) {
            window.workspaceCollaboration.emitDrawingStroke(
                this.currentStrokePoints,
                this.drawSettings.color,
                this.drawSettings.brushSize,
                this.drawSettings.opacity / 100,
                this.drawSettings.tool
            );
        }

        this.currentStrokePoints = []; // Reset

        if (this.drawCtx) {
            this.drawCtx.beginPath();
        }
    }
}

// Global accessor
window.initWorkflowTools = (app) => {
    window.workflowTools = new WorkflowTools(app);
};

// Global helper that HTML buttons might call
window.togglePopup = (id) => {
    if (window.workflowTools) {
        window.workflowTools.togglePopup(id);
    } else {
        // Fallback if accessed before tools init
        const popup = document.getElementById(id);
        if (popup) popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
    }
};

// Close popup helper
window.closePopup = (id) => {
    if (window.workflowTools) {
        window.workflowTools.closePopup(id);
    } else {
        const popup = document.getElementById(id);
        if (popup) popup.style.display = 'none';
    }
};
