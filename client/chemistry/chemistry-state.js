/**
 * Chemistry Workspace State Management
 * Unifies state handling (Stickies, Drawing, Saving) across all Chemistry pages.
 */

window.drawingInitialized = false;
window.drawCanvas = null;
window.drawCtx = null;
window.isDrawing = false;
window.isCanvasVisible = true;
window.isDrawingActive = false;
window.drawSettings = {
    tool: 'pen',
    color: '#8b5cf6',
    brushSize: 3,
    opacity: 100
};

const WorkspaceState = {
    projectId: null,
    currentPage: 'unknown',
    unsavedChanges: false,
    stickyNotes: new Map(), // noteId -> noteData

    // Initialize from URL
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('id') || urlParams.get('project') || urlParams.get('projectId');

        // Auto-detect current page from filename
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        this.currentPage = filename || 'unknown';

        if (!this.projectId) {
            console.warn('No projectId in URL - state will not be saved to database (using fallback)');
            this.projectId = 'dev-demo-project';
        }

        // Update Navigation Links to preserve Project ID
        if (this.projectId && this.projectId !== 'dev-demo-project') {
            document.querySelectorAll('.nav-pill').forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.includes('?')) {
                    link.href = `${href}?projectId=${this.projectId}`;
                }
            });
        }

        // Initialize event listeners for Save and FABs if they exist
        this.bindEvents();

        // Load saved state
        this.loadState();
    },

    bindEvents() {
        // Save button
        document.getElementById('project-save-btn')?.addEventListener('click', () => {
            this.save();
        });

        // Sticky Note FAB
        document.getElementById('fab-sticky')?.addEventListener('click', () => {
            this.createStickyNote();
        });

        // Draw FAB (trigger popup)
        document.getElementById('fab-draw')?.addEventListener('click', () => {
            window.togglePopup('draw-popup');
            if (!window.drawingInitialized) window.initDrawingTool();
        });

        // Chat FAB
        document.getElementById('fab-chat')?.addEventListener('click', () => {
            window.togglePopup('chat-popup');
        });

        // Notes FAB
        document.getElementById('fab-notes')?.addEventListener('click', () => {
            window.togglePopup('notes-popup');
        });
    },

    // Generate unique ID
    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Capture complete state
    captureState() {
        const notesArray = [];
        this.stickyNotes.forEach((note, id) => {
            const noteEl = document.getElementById(id);
            if (noteEl) {
                notesArray.push({
                    id,
                    content: note.content,
                    x: noteEl.offsetLeft,
                    y: noteEl.offsetTop,
                    zIndex: noteEl.style.zIndex || 1000
                });
            }
        });

        // Get canvas data
        let canvasData = null;
        if (window.drawCanvas && window.drawCanvas.style.display !== 'none') {
            try {
                canvasData = window.drawCanvas.toDataURL('image/png');
            } catch (e) {
                console.error('Failed to capture canvas:', e);
            }
        }

        return {
            page: this.currentPage,
            notes: notesArray,
            canvas: canvasData,
            timestamp: new Date().toISOString()
        };
    },

    // Save to database
    async save() {
        if (!this.projectId) {
            alert('Cannot save: No project ID');
            return;
        }

        const saveBtn = document.getElementById('project-save-btn');
        const saveText = document.getElementById('save-status-text');

        if (saveBtn) saveBtn.classList.add('saving');
        if (saveText) saveText.textContent = 'Saving...';

        try {
            const state = this.captureState();
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            const res = await fetch(`/api/projects/${this.projectId}/workspace-state`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    workspace: `chemistry-${this.currentPage}`,
                    state
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Save failed - Status:', res.status, 'Response:', errorText);
                throw new Error(`Save failed: ${res.status} - ${errorText}`);
            }

            this.unsavedChanges = false;
            if (saveBtn) saveBtn.classList.remove('saving', 'unsaved');

            const now = new Date();
            if (saveText) saveText.textContent = `Saved ${now.toLocaleTimeString()}`;

            console.log('✅ Workspace state saved successfully');
        } catch (error) {
            console.error('Save error:', error);
            if (saveBtn) saveBtn.classList.remove('saving');
            if (saveText) saveText.textContent = 'Save failed';
            alert('Failed to save project state');
        }
    },

    // Load from database
    async loadState() {
        if (!this.projectId) {
            this.loadFromLocalStorage();
            return;
        }

        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            const res = await fetch(
                `/api/projects/${this.projectId}/workspace-state?workspace=chemistry-${this.currentPage}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include'
                }
            );

            if (!res.ok) throw new Error('Load failed');

            const { data } = await res.json();

            if (data && data.state) {
                console.log('📥 Loading workspace state from database');
                this.restoreState(data.state);
            } else {
                console.log('No saved state found, trying localStorage fallback');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Load error:', error);
            this.loadFromLocalStorage();
        }
    },

    // Restore state
    restoreState(state) {
        if (state.notes && state.notes.length > 0) {
            state.notes.forEach(noteData => {
                this.createStickyNote(noteData);
            });
        }

        if (state.canvas && window.drawCanvas) {
            this.loadCanvasState(state.canvas);
        } else if (state.canvas && !window.drawCanvas) {
            // If canvas not initialized yet, wait for it
            setTimeout(() => {
                if (window.drawCanvas) this.loadCanvasState(state.canvas);
            }, 500);
        }
    },

    // Load canvas from data URL
    loadCanvasState(dataURL) {
        const img = new Image();
        img.onload = () => {
            if (window.drawCtx) {
                window.drawCtx.clearRect(0, 0, window.drawCanvas.width, window.drawCanvas.height);
                window.drawCtx.drawImage(img, 0, 0);
                console.log('✅ Canvas restored');
            }
        };
        img.onerror = () => {
            console.error('Failed to load canvas image');
        };
        img.src = dataURL;
    },

    // LocalStorage fallback
    loadFromLocalStorage() {
        const savedSticky = localStorage.getItem('chemistry-sticky-note');
        const savedPosition = localStorage.getItem('chemistry-sticky-position');

        if (savedSticky) {
            console.log('📦 Loading from localStorage fallback');
            const pos = savedPosition ? JSON.parse(savedPosition) : { x: window.innerWidth - 320, y: 100 };
            this.createStickyNote({
                content: savedSticky,
                x: pos.x,
                y: pos.y
            });
        }
    },

    // Mark as unsaved
    markUnsaved() {
        if (this.unsavedChanges) return;

        this.unsavedChanges = true;
        const saveBtn = document.getElementById('project-save-btn');
        const saveText = document.getElementById('save-status-text');

        if (saveBtn) saveBtn.classList.add('unsaved');
        if (saveText) saveText.textContent = 'Unsaved changes';
    },

    // Create sticky note
    createStickyNote(data = {}) {
        const noteId = data.id || this.generateId();
        const content = data.content || '';
        const x = data.x !== undefined ? data.x : window.innerWidth - 320;
        const y = data.y !== undefined ? data.y : 100 + (this.stickyNotes.size * 30);
        const zIndex = data.zIndex || 1000 + this.stickyNotes.size;

        const container = document.getElementById('sticky-notes-container');
        if (!container) return;

        const noteEl = document.createElement('div');
        noteEl.id = noteId;
        noteEl.className = 'sticky-note-card';
        noteEl.style.left = x + 'px';
        noteEl.style.top = y + 'px';
        noteEl.style.zIndex = zIndex;

        noteEl.innerHTML = `
            <div class="sticky-note-header">
                <button class="sticky-delete-btn" title="Delete">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
            <textarea id="${noteId}-textarea" name="sticky-note-content" placeholder="Quick note...">${content}</textarea>
        `;

        container.appendChild(noteEl);

        // Store note data
        this.stickyNotes.set(noteId, { content, x, y, zIndex });

        // Setup event listeners
        const textarea = noteEl.querySelector('textarea');
        const deleteBtn = noteEl.querySelector('.sticky-delete-btn');

        // Save content on input
        textarea.addEventListener('input', () => {
            const note = this.stickyNotes.get(noteId);
            note.content = textarea.value;
            this.markUnsaved();
        });

        // Delete note
        deleteBtn.addEventListener('click', () => {
            noteEl.remove();
            this.stickyNotes.delete(noteId);
            this.markUnsaved();
        });

        // Make draggable
        this.makeDraggable(noteEl, noteId, textarea);

        return noteId;
    },

    // Make note draggable
    makeDraggable(noteEl, noteId, textarea) {
        let isDragging = false;
        let initialX, initialY;

        noteEl.addEventListener('mousedown', (e) => {
            if (e.target === textarea) return;

            isDragging = true;
            initialX = e.clientX - noteEl.offsetLeft;
            initialY = e.clientY - noteEl.offsetTop;
            noteEl.style.cursor = 'grabbing';

            const maxZ = Math.max(...Array.from(this.stickyNotes.values()).map(n => parseInt(n.zIndex) || 1000));
            noteEl.style.zIndex = maxZ + 1;
            const note = this.stickyNotes.get(noteId);
            note.zIndex = maxZ + 1;
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
            noteEl.style.cursor = 'grab';

            const note = this.stickyNotes.get(noteId);
            note.x = noteEl.offsetLeft;
            note.y = noteEl.offsetTop;
            this.markUnsaved();
        });
    }
};

window.WorkspaceState = WorkspaceState;

// ==========================================
// DRAWING TOOL
// ==========================================

window.initDrawingTool = function () {
    window.drawingInitialized = true;
    window.drawCanvas = document.getElementById('draw-canvas');
    if (!window.drawCanvas) return;

    window.drawCtx = window.drawCanvas.getContext('2d', { willReadFrequently: true });

    // Set canvas size
    window.drawCanvas.width = window.innerWidth;
    window.drawCanvas.height = window.innerHeight;

    // Make canvas visible by default (but drawing disabled)
    window.drawCanvas.style.display = 'block';
    window.drawCanvas.style.pointerEvents = 'none';

    // Custom cursor elements
    const customCursor = document.getElementById('custom-cursor');
    const cursorCircle = document.getElementById('cursor-circle');
    const cursorIcon = document.getElementById('cursor-icon');

    // Update custom cursor size based on tool and brush size
    function updateCursorSize() {
        if (window.drawSettings.tool === 'eraser') {
            const size = window.drawSettings.brushSize * 3;
            if (cursorCircle) {
                cursorCircle.style.width = size + 'px';
                cursorCircle.style.height = size + 'px';
            }
            if (cursorIcon) cursorIcon.style.display = 'block';
            if (customCursor) customCursor.style.display = 'block';
        } else {
            if (customCursor) customCursor.style.display = 'none';
        }
    }

    // Track mouse movement for custom cursor
    window.drawCanvas.addEventListener('mousemove', (e) => {
        if (window.drawSettings.tool === 'eraser' && window.drawCanvas.style.display === 'block') {
            if (customCursor) {
                customCursor.style.left = e.clientX + 'px';
                customCursor.style.top = e.clientY + 'px';
                customCursor.style.display = 'block';
            }
        } else {
            if (customCursor) customCursor.style.display = 'none';
        }
    });

    // Hide cursor when leaving canvas
    window.drawCanvas.addEventListener('mouseleave', () => {
        if (customCursor) customCursor.style.display = 'none';
    });

    // Tool buttons
    document.querySelectorAll('.draw-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.draw-tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.drawSettings.tool = btn.dataset.tool;
            updateCursorSize();
        });
    });

    // Color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.drawSettings.color = btn.dataset.color;
        });
    });

    // Settings inputs
    const brushSizeInput = document.getElementById('brush-size');
    const brushSizeVal = document.getElementById('brush-size-value');
    if (brushSizeInput) {
        brushSizeInput.addEventListener('input', (e) => {
            window.drawSettings.brushSize = parseInt(e.target.value);
            if (brushSizeVal) brushSizeVal.textContent = window.drawSettings.brushSize;
            updateCursorSize();
        });
    }

    const opacityInput = document.getElementById('draw-opacity');
    const opacityVal = document.getElementById('opacity-value');
    if (opacityInput) {
        opacityInput.addEventListener('input', (e) => {
            window.drawSettings.opacity = parseInt(e.target.value);
            if (opacityVal) opacityVal.textContent = window.drawSettings.opacity;
        });
    }

    // Canvas Actions
    const clearBtn = document.getElementById('btn-clear-canvas');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (window.drawCtx) {
                window.drawCtx.clearRect(0, 0, window.drawCanvas.width, window.drawCanvas.height);
                window.WorkspaceState.markUnsaved();
            }
        });
    }

    const toggleVisBtn = document.getElementById('btn-toggle-visibility');
    if (toggleVisBtn) {
        toggleVisBtn.addEventListener('click', () => {
            window.isCanvasVisible = !window.isCanvasVisible;
            const text = document.getElementById('toggle-visibility-text');
            const icon = toggleVisBtn.querySelector('.material-icons-round');

            if (window.isCanvasVisible) {
                window.drawCanvas.style.display = 'block';
                if (icon) icon.textContent = 'visibility_off';
                if (text) text.textContent = 'Hide';
            } else {
                window.drawCanvas.style.display = 'none';
                if (icon) icon.textContent = 'visibility';
                if (text) text.textContent = 'Show';
            }
        });
    }

    const toggleDrawBtn = document.getElementById('btn-toggle-draw');
    if (toggleDrawBtn) {
        toggleDrawBtn.addEventListener('click', () => {
            window.isDrawingActive = !window.isDrawingActive;
            const text = document.getElementById('toggle-draw-text');
            const icon = toggleDrawBtn.querySelector('.material-icons-round');

            if (window.isDrawingActive) {
                window.drawCanvas.style.display = 'block';
                window.drawCanvas.style.pointerEvents = 'auto';
                window.drawCanvas.classList.add('drawing-active');
                if (text) text.textContent = 'Disable Drawing';
                if (icon) icon.textContent = 'edit';
            } else {
                window.drawCanvas.style.pointerEvents = 'none';
                window.drawCanvas.classList.remove('drawing-active');
                if (text) text.textContent = 'Enable Drawing';
                if (icon) icon.textContent = 'edit_off';
            }
        });
    }

    // Drawing Logic
    window.drawCanvas.addEventListener('mousedown', startDraw);
    window.drawCanvas.addEventListener('mousemove', draw);
    window.drawCanvas.addEventListener('mouseup', stopDraw);
    window.drawCanvas.addEventListener('mouseout', stopDraw);
};

function startDraw(e) {
    window.isDrawing = true;
    window.drawCtx.beginPath();
    window.drawCtx.moveTo(e.clientX, e.clientY);
}

function draw(e) {
    if (!window.isDrawing) return;

    window.drawCtx.lineWidth = window.drawSettings.brushSize;
    window.drawCtx.lineCap = 'round';
    window.drawCtx.lineJoin = 'round';

    if (window.drawSettings.tool === 'eraser') {
        window.drawCtx.globalCompositeOperation = 'destination-out';
        window.drawCtx.strokeStyle = 'rgba(0,0,0,1)';
        window.drawCtx.globalAlpha = 1;
    } else if (window.drawSettings.tool === 'highlighter') {
        window.drawCtx.globalCompositeOperation = 'source-over';
        window.drawCtx.strokeStyle = window.drawSettings.color;
        window.drawCtx.globalAlpha = 0.3;
    } else {
        window.drawCtx.globalCompositeOperation = 'source-over';
        window.drawCtx.strokeStyle = window.drawSettings.color;
        window.drawCtx.globalAlpha = window.drawSettings.opacity / 100;
    }

    window.drawCtx.lineTo(e.clientX, e.clientY);
    window.drawCtx.stroke();
    window.drawCtx.beginPath();
    window.drawCtx.moveTo(e.clientX, e.clientY);
}

function stopDraw() {
    if (window.isDrawing) {
        window.WorkspaceState.markUnsaved();
    }
    window.isDrawing = false;
    window.drawCtx.globalAlpha = 1;
}

window.addEventListener('resize', () => {
    if (window.drawCanvas) {
        const imageData = window.drawCtx.getImageData(0, 0, window.drawCanvas.width, window.drawCanvas.height);
        window.drawCanvas.width = window.innerWidth;
        window.drawCanvas.height = window.innerHeight;
        window.drawCtx.putImageData(imageData, 0, 0);
    }
});
