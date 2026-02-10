
// ==========================================
// WORKSPACE LOGIC (Replicated from Biology)
// ==========================================

// Global Variables
let drawingInitialized = false;
let drawCanvas, drawCtx;
let isDrawing = false;
let isCanvasVisible = true; // Start as visible
let isDrawingActive = false; // Start as disabled
let drawSettings = {
    tool: 'pen',
    color: '#0088FF', // Biology Blue default
    brushSize: 3,
    opacity: 100
};

// Real-time collaboration stroke tracking
let currentStrokePoints = [];
let isRemoteDrawing = false; // Flag to prevent broadcast loops

// ==========================================
// UI HELPERS
// ==========================================

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position: fixed; bottom: 100px; right: 30px; background: rgba(0, 0, 0, 0.9); color: white; padding: 12px 20px; border-radius: 8px; z-index: 10000; animation: slideIn 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function showCustomConfirm(message, onConfirm) {
    const overlay = document.getElementById('custom-confirm-overlay');
    if (!overlay) {
        if (confirm(message)) onConfirm();
        return;
    }
    const messageEl = document.getElementById('confirm-message');
    const cancelBtn = document.getElementById('confirm-cancel');
    const okBtn = document.getElementById('confirm-ok');

    messageEl.textContent = message;
    overlay.style.display = 'flex';

    const handleCancel = () => {
        overlay.style.display = 'none';
        cancelBtn.removeEventListener('click', handleCancel);
        okBtn.removeEventListener('click', handleOk);
    };

    const handleOk = () => {
        overlay.style.display = 'none';
        cancelBtn.removeEventListener('click', handleCancel);
        okBtn.removeEventListener('click', handleOk);
        onConfirm();
    };

    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);
}

function togglePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (!popup) return;

    if (popup.classList.contains('active')) {
        popup.classList.remove('active');
    } else {
        document.querySelectorAll('.popup-panel').forEach(p => p.classList.remove('active'));
        popup.classList.add('active');
    }
}

window.closePopup = function (popupId) {
    const el = document.getElementById(popupId);
    if (el) el.classList.remove('active');
}

// Global Navigation Helper to persist Project ID
window.navigateTo = function (url) {
    if (!url) return;

    // Check if URL already has a query string
    const separator = url.includes('?') ? '&' : '?';

    // Get Project ID from WorkspaceState
    const projectId = WorkspaceState.projectId;

    if (projectId && projectId !== 'dev-demo-project') {
        window.location.href = `${url}${separator}id=${projectId}`;
    } else {
        window.location.href = url;
    }
};

// ==========================================
// WORKSPACE STATE MANAGEMENT
// ==========================================

const WorkspaceState = {
    projectId: null,
    currentPage: 'study', // Default, will be updated in init
    unsavedChanges: false,
    stickyNotes: new Map(), // noteId -> noteData

    // Initialize from URL and Page
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('id') || urlParams.get('project') || urlParams.get('projectId');

        // Detect current page based on filename
        const path = window.location.pathname;
        if (path.includes('lab_titration.html')) this.currentPage = 'titration';
        else if (path.includes('lab_flame_test.html')) this.currentPage = 'flame_test';
        else if (path.includes('lab.html')) this.currentPage = 'lab';
        else if (path.includes('simulation.html')) this.currentPage = 'simulation';
        else this.currentPage = 'study';

        console.log(`Workspace initialized for Chemistry - ${this.currentPage}`);

        if (!this.projectId) {
            console.warn('No projectId in URL - state will not be saved to database');
            // Default to demo if no project ID, to allow testing
            this.projectId = 'dev-demo-project';
        }

        // Update Navigation Links to preserve Project ID
        if (this.projectId && this.projectId !== 'dev-demo-project') {
            document.querySelectorAll('.nav-pill').forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.includes('?')) {
                    link.href = `${href}?id=${this.projectId}`;
                }
            });
        }

        // Initialize Workspace Services
        this.initServices();

        // Load saved state
        this.loadState();
    },

    initServices() {
        if (typeof WorkspaceChatbot !== 'undefined') {
            window.chatbot = new WorkspaceChatbot({
                workspace: 'chemistry',
                containerId: 'ai-panel',
                inputId: 'omni-input',
                sendButtonId: 'omni-send',
                projectId: this.projectId
            });
        }

        if (typeof WorkspaceNotes !== 'undefined') {
            window.workspaceNotes = new WorkspaceNotes({
                workspace: 'chemistry',
                projectId: this.projectId,
                notepadId: 'notepad'
            });
        }

        if (typeof StudyTimer !== 'undefined') {
            window.studyTimer = new StudyTimer({
                projectId: this.projectId,
                workspace: 'chemistry',
                category: 'chemistry',
                containerId: 'navbar-controls'
            });
        }
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
        if (drawCanvas && drawCanvas.style.display !== 'none') {
            try {
                canvasData = drawCanvas.toDataURL('image/png');
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
        const saveBtn = document.getElementById('project-save-btn');
        const saveText = document.getElementById('save-status-text');

        if (saveBtn) saveBtn.classList.add('saving');
        if (saveText) saveText.textContent = 'Saving...';

        try {
            const state = this.captureState();

            if (this.projectId && this.projectId !== 'dev-demo-project') {
                const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
                // Note: Using chemistry context
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
                    throw new Error(`Save failed: ${res.status}`);
                }
                console.log('✅ Workspace state saved to API');
            } else {
                // Demo mode simulation
                await new Promise(r => setTimeout(r, 500));
                console.log('Demo Save (LocalStorage fallback)');
            }

            this.finalizeSave(true);

            // Also save to LocalStorage as backup/demo
            this.saveToLocalStorage(state);

        } catch (error) {
            console.error('Save error:', error);
            // Fallback to local storage
            this.saveToLocalStorage();
        }
    },

    finalizeSave(success) {
        const saveBtn = document.getElementById('project-save-btn');
        const saveText = document.getElementById('save-status-text');

        this.unsavedChanges = false;

        if (saveBtn) {
            saveBtn.classList.remove('saving', 'unsaved');
        }

        if (saveText) {
            const now = new Date();
            saveText.textContent = success ? `Saved ${now.toLocaleTimeString()}` : 'Save failed';
        }
    },

    // Save to LocalStorage
    saveToLocalStorage(stateData = null) {
        try {
            const state = stateData || this.captureState();
            const key = `chemistry-${this.currentPage}-state-${this.projectId || 'demo'}`;
            localStorage.setItem(key, JSON.stringify(state));
            this.finalizeSave(true);
            console.log('✅ Workspace state saved to LocalStorage');
        } catch (e) {
            console.error('LocalStorage save failed:', e);
            this.finalizeSave(false);
        }
    },

    // Load from database
    async loadState() {
        try {
            if (this.projectId && this.projectId !== 'dev-demo-project') {
                const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
                const res = await fetch(
                    `/api/projects/${this.projectId}/workspace-state?workspace=chemistry-${this.currentPage}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        credentials: 'include'
                    }
                );

                if (res.ok) {
                    const { data } = await res.json();
                    if (data && data.state) {
                        console.log('📥 Loading workspace state from database');
                        this.restoreState(data.state);
                        return;
                    }
                }
            }
            throw new Error('No DB state or Demo mode');
        } catch (error) {
            console.log('Checking LocalStorage for saved state...');
            this.loadFromLocalStorage();
        }
    },

    // Restore state
    restoreState(state) {
        // Restore notes
        if (state.notes && Array.isArray(state.notes)) {
            state.notes.forEach(noteData => {
                if (!document.getElementById(noteData.id)) {
                    this.createStickyNote(noteData);
                }
            });
        }

        // Restore canvas
        if (state.canvas && drawCanvas) {
            this.loadCanvasState(state.canvas);
        }
    },

    // Load canvas from data URL
    loadCanvasState(dataURL) {
        const img = new Image();
        img.onload = () => {
            if (drawCtx) {
                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                drawCtx.drawImage(img, 0, 0);
                console.log('✅ Canvas restored');
            }
        };
        img.src = dataURL;
    },

    // LocalStorage fallback
    loadFromLocalStorage() {
        const key = `chemistry-${this.currentPage}-state-${this.projectId || 'demo'}`;
        const savedState = localStorage.getItem(key);

        if (savedState) {
            try {
                console.log('📦 Loading from LocalStorage');
                this.restoreState(JSON.parse(savedState));
            } catch (e) {
                console.error('Failed to parse local storage', e);
            }
        }

        // Also check legacy sticky note key if no new state
        if (!savedState) {
            const legacySticky = localStorage.getItem('chemistry-sticky-note'); // Assuming similar legacy key
            if (legacySticky) {
                this.createStickyNote({ content: legacySticky });
            }
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

        const container = document.getElementById('sticky-notes-container');
        if (container) container.appendChild(noteEl);
        else document.body.appendChild(noteEl);

        // Store note data
        this.stickyNotes.set(noteId, { content, x, y, zIndex });

        // Broadcast creation if it's a new local note
        if (!data.id && window.workspaceCollaboration) {
            window.workspaceCollaboration.emitStickyNoteUpdate('create', {
                id: noteId, content, x, y, zIndex
            });
        }

        // Setup event listeners
        const textarea = noteEl.querySelector('textarea');
        const deleteBtn = noteEl.querySelector('.sticky-delete-btn');

        // Save content on input
        if (textarea) {
            textarea.addEventListener('input', () => {
                const note = this.stickyNotes.get(noteId);
                if (note) {
                    note.content = textarea.value;

                    // Broadcast update (debounced ideally, but simple here)
                    if (window.workspaceCollaboration) {
                        window.workspaceCollaboration.emitStickyNoteUpdate('update', {
                            id: noteId, content: textarea.value
                        });
                    }
                }
                this.markUnsaved();
            });
        }

        // Delete note
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                noteEl.remove();
                this.stickyNotes.delete(noteId);
                this.markUnsaved();

                // Broadcast deletion
                if (window.workspaceCollaboration) {
                    window.workspaceCollaboration.emitStickyNoteUpdate('delete', { id: noteId });
                }
            });
        }

        // Make draggable
        this.makeDraggable(noteEl, noteId, textarea);

        return noteId;
    },

    // Make note draggable
    makeDraggable(noteEl, noteId, textarea) {
        let isDragging = false;
        let initialX, initialY;

        noteEl.addEventListener('mousedown', (e) => {
            if (e.target === textarea) return; // Don't drag when typing

            isDragging = true;
            initialX = e.clientX - noteEl.offsetLeft;
            initialY = e.clientY - noteEl.offsetTop;
            noteEl.style.cursor = 'grabbing';

            // Bring to front
            const maxZ = Math.max(...Array.from(this.stickyNotes.values()).map(n => parseInt(n.zIndex) || 1000), 999);
            noteEl.style.zIndex = maxZ + 1;
            const note = this.stickyNotes.get(noteId);
            if (note) note.zIndex = maxZ + 1;
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

            // Save position
            const note = this.stickyNotes.get(noteId);
            if (note) {
                note.x = noteEl.offsetLeft;
                note.y = noteEl.offsetTop;

                // Broadcast movement
                if (window.workspaceCollaboration) {
                    window.workspaceCollaboration.emitStickyNoteUpdate('move', {
                        id: noteId,
                        x: note.x,
                        y: note.y
                    });
                }
            }
            this.markUnsaved();
        });
    }
};

// ==========================================
// DRAWING TOOL FUNCTIONS
// ==========================================

function initDrawingTool() {
    drawingInitialized = true;
    drawCanvas = document.getElementById('draw-canvas');
    if (!drawCanvas) {
        console.error('Drawing canvas not found');
        return;
    }

    drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });

    // Set canvas size
    drawCanvas.width = window.innerWidth;
    drawCanvas.height = window.innerHeight;

    // Make canvas visible by default (but drawing disabled)
    drawCanvas.style.display = 'block';
    drawCanvas.style.pointerEvents = 'none'; // Disabled until activated

    // Custom cursor elements
    const customCursor = document.getElementById('custom-cursor');
    const cursorCircle = document.getElementById('cursor-circle');
    const cursorIcon = document.getElementById('cursor-icon');

    // Update custom cursor size based on tool and brush size
    function updateCursorSize() {
        if (!customCursor || !cursorCircle) return;

        if (drawSettings.tool === 'eraser') {
            const size = drawSettings.brushSize * 3; // Eraser is 3x brush size
            cursorCircle.style.width = size + 'px';
            cursorCircle.style.height = size + 'px';
            if (cursorIcon) cursorIcon.style.display = 'block';
            customCursor.style.display = 'block';
        } else {
            customCursor.style.display = 'none';
        }
    }

    // Track mouse movement for custom cursor
    drawCanvas.addEventListener('mousemove', (e) => {
        if (customCursor && drawSettings.tool === 'eraser' && drawCanvas.style.display === 'block') {
            customCursor.style.left = e.clientX + 'px';
            customCursor.style.top = e.clientY + 'px';
            customCursor.style.display = 'block';
        } else if (customCursor) {
            customCursor.style.display = 'none';
        }
    });

    // Hide cursor when leaving canvas
    drawCanvas.addEventListener('mouseleave', () => {
        if (customCursor) customCursor.style.display = 'none';
    });

    // Tool selection
    document.querySelectorAll('.draw-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.draw-tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            drawSettings.tool = btn.dataset.tool;
            updateCursorSize(); // Update cursor when tool changes
        });
    });

    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            drawSettings.color = btn.dataset.color;
        });
    });

    // Brush size
    const brushSizeInput = document.getElementById('brush-size');
    const brushSizeValue = document.getElementById('brush-size-value');
    if (brushSizeInput) {
        brushSizeInput.addEventListener('input', () => {
            drawSettings.brushSize = parseInt(brushSizeInput.value);
            if (brushSizeValue) brushSizeValue.textContent = brushSizeInput.value;
            updateCursorSize(); // Update cursor size when brush size changes
        });
    }

    // Opacity
    const opacityInput = document.getElementById('draw-opacity');
    const opacityValue = document.getElementById('opacity-value');
    if (opacityInput) {
        opacityInput.addEventListener('input', () => {
            drawSettings.opacity = parseInt(opacityInput.value);
            if (opacityValue) opacityValue.textContent = opacityInput.value;
        });
    }

    // Clear canvas
    document.getElementById('btn-clear-canvas')?.addEventListener('click', () => {
        showCustomConfirm('Clear all drawings?', () => {
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            WorkspaceState.markUnsaved();

            // Broadcast canvas clear to collaborators
            if (window.workspaceCollaboration) {
                window.workspaceCollaboration.emitDrawingClear();
            }
        });
    });

    // Toggle canvas visibility
    const visibilityBtn = document.getElementById('btn-toggle-visibility');
    const visibilityText = document.getElementById('toggle-visibility-text');
    const visibilityIcon = visibilityBtn?.querySelector('.material-icons-round');

    // Initialize button UI to match default visible state
    if (isCanvasVisible && visibilityBtn) {
        if (visibilityText) visibilityText.textContent = 'Hide';
        if (visibilityIcon) visibilityIcon.textContent = 'visibility';
        visibilityBtn.style.background = 'rgba(96, 165, 250, 0.2)';
        visibilityBtn.style.color = 'var(--accent-light)';
    }

    if (visibilityBtn) {
        visibilityBtn.addEventListener('click', () => {
            isCanvasVisible = !isCanvasVisible;

            if (isCanvasVisible) {
                drawCanvas.style.display = 'block';
                if (visibilityText) visibilityText.textContent = 'Hide';
                if (visibilityIcon) visibilityIcon.textContent = 'visibility';
                visibilityBtn.style.background = 'rgba(96, 165, 250, 0.2)';
                visibilityBtn.style.color = 'var(--accent-light)';
            } else {
                drawCanvas.style.display = 'none';
                drawCanvas.style.pointerEvents = 'none'; // Disable drawing when hiding

                // If we were drawing, also disable that mode
                if (isDrawingActive) {
                    isDrawingActive = false;
                    // Reset toggle button if exists
                    const toggleBtn = document.getElementById('btn-toggle-draw');
                    if (toggleBtn) {
                        const toggleText = document.getElementById('toggle-draw-text');
                        const toggleIcon = toggleBtn.querySelector('.material-icons-round');
                        if (toggleText) toggleText.textContent = 'Enable Drawing';
                        if (toggleIcon) toggleIcon.textContent = 'edit_off';
                        toggleBtn.style.background = '';
                        toggleBtn.style.color = '';

                        // Restore iFrames
                        document.querySelectorAll('iframe').forEach(iframe => {
                            iframe.style.pointerEvents = 'auto';
                        });
                    }
                }

                if (visibilityText) visibilityText.textContent = 'Show';
                if (visibilityIcon) visibilityIcon.textContent = 'visibility_off';
                visibilityBtn.style.background = '';
                visibilityBtn.style.color = '';
            }
        });
    }

    // Toggle drawing mode (only works when canvas is visible)
    const toggleBtn = document.getElementById('btn-toggle-draw');
    const toggleText = document.getElementById('toggle-draw-text');
    const toggleIcon = toggleBtn?.querySelector('.material-icons-round');

    if (toggleBtn) {
        toggleBtn.onclick = () => {
            if (!isCanvasVisible) {
                // Auto-show canvas when enabling drawing
                isCanvasVisible = true;
                drawCanvas.style.display = 'block';
                if (visibilityBtn) {
                    if (visibilityText) visibilityText.textContent = 'Hide';
                    if (visibilityIcon) visibilityIcon.textContent = 'visibility';
                    visibilityBtn.style.background = 'rgba(96, 165, 250, 0.2)';
                    visibilityBtn.style.color = 'var(--accent-light)';
                }
            }

            isDrawingActive = !isDrawingActive;

            if (isDrawingActive) {
                drawCanvas.style.pointerEvents = 'auto'; // Enable drawing
                drawCanvas.classList.add('drawing-active');
                if (toggleText) toggleText.textContent = 'Disable Drawing';
                if (toggleIcon) toggleIcon.textContent = 'edit';
                toggleBtn.style.background = 'var(--accent-primary)';
                toggleBtn.style.color = 'black';

                // Disable pointer events on iframes to allow drawing over them
                document.querySelectorAll('iframe').forEach(iframe => {
                    iframe.style.pointerEvents = 'none';
                });

            } else {
                drawCanvas.style.pointerEvents = 'none'; // Disable drawing
                drawCanvas.classList.remove('drawing-active');
                if (toggleText) toggleText.textContent = 'Enable Drawing';
                if (toggleIcon) toggleIcon.textContent = 'edit_off';
                toggleBtn.style.background = '';
                toggleBtn.style.color = '';

                // Restore pointer events on iframes
                document.querySelectorAll('iframe').forEach(iframe => {
                    iframe.style.pointerEvents = 'auto';
                });
            }
        };
    }

    // Drawing events
    drawCanvas.addEventListener('mousedown', startDrawing);
    drawCanvas.addEventListener('mousemove', draw);
    drawCanvas.addEventListener('mouseup', stopDrawing);
    drawCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile/tablet
    drawCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        drawCanvas.dispatchEvent(mouseEvent);
    });

    drawCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        drawCanvas.dispatchEvent(mouseEvent);
    });

    drawCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        drawCanvas.dispatchEvent(mouseEvent);
    });

    // Setup real-time collaboration for drawing
    setupDrawingCollaboration();
}

/**
 * Render a stroke received from a remote collaborator
 * @param {Object} data - Stroke data from collaborator
 */
function renderRemoteStroke(data) {
    if (!drawCanvas || !drawCtx) return;
    if (!data.points || data.points.length < 2) return;

    isRemoteDrawing = true;

    // Save current context state
    const savedAlpha = drawCtx.globalAlpha;
    const savedComposite = drawCtx.globalCompositeOperation;

    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';

    if (data.tool === 'eraser') {
        drawCtx.globalCompositeOperation = 'destination-out';
        drawCtx.lineWidth = data.size * 3;
    } else {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.lineWidth = data.size;

        if (data.tool === 'highlighter') {
            drawCtx.globalAlpha = 0.3;
        } else {
            drawCtx.globalAlpha = data.opacity || 1;
        }

        drawCtx.strokeStyle = data.color || '#0088FF';
    }

    // Draw the stroke
    drawCtx.beginPath();
    drawCtx.moveTo(data.points[0].x, data.points[0].y);

    for (let i = 1; i < data.points.length; i++) {
        drawCtx.lineTo(data.points[i].x, data.points[i].y);
    }

    drawCtx.stroke();

    // Restore context state
    drawCtx.globalAlpha = savedAlpha;
    drawCtx.globalCompositeOperation = savedComposite;
    drawCtx.beginPath();

    isRemoteDrawing = false;
}

/**
 * Setup real-time collaboration listeners for drawing
 */
function setupDrawingCollaboration() {
    const checkCollab = setInterval(() => {
        if (window.workspaceCollaboration) {
            clearInterval(checkCollab);

            // Listen for drawing strokes from other users
            window.workspaceCollaboration.onDrawingStroke((data) => {
                renderRemoteStroke(data);
                window.workspaceCollaboration.showSyncNotification('drawing', data.userName);
            });

            // Listen for canvas clear events
            window.workspaceCollaboration.onDrawingClear((data) => {
                if (drawCanvas && drawCtx) {
                    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                    window.workspaceCollaboration.showSyncNotification('drawing', data.userName);
                }
            });

            // Listen for sticky note updates
            window.workspaceCollaboration.onStickyNoteUpdate((data) => {
                handleRemoteStickyNote(data);
            });

            console.log('🎨 Drawing real-time collaboration enabled');
        }
    }, 500);

    setTimeout(() => clearInterval(checkCollab), 10000);
}

/**
 * Handle sticky note updates from collaborators
 */
function handleRemoteStickyNote(data) {
    const { action, noteData, userName } = data;

    switch (action) {
        case 'create':
            if (!document.getElementById(noteData.id)) {
                WorkspaceState.createStickyNote(noteData);
                window.workspaceCollaboration?.showSyncNotification('sticky', userName);
            }
            break;
        case 'update':
            const textarea = document.querySelector(`#${noteData.id} textarea`);
            if (textarea && textarea.value !== noteData.content) {
                textarea.value = noteData.content;
            }
            break;
        case 'delete':
            const noteEl = document.getElementById(noteData.id);
            if (noteEl) {
                noteEl.remove();
                WorkspaceState.stickyNotes.delete(noteData.id);
            }
            break;
        case 'move':
            const moveEl = document.getElementById(noteData.id);
            if (moveEl) {
                moveEl.style.left = noteData.x + 'px';
                moveEl.style.top = noteData.y + 'px';
            }
            break;
    }
}

function startDrawing(e) {
    isDrawing = true;
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Initialize stroke points for real-time collaboration
    currentStrokePoints = [{ x, y }];

    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;

    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track stroke points for real-time collaboration
    currentStrokePoints.push({ x, y });

    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';

    if (drawSettings.tool === 'eraser') {
        drawCtx.globalCompositeOperation = 'destination-out';
        drawCtx.lineWidth = drawSettings.brushSize * 3;
    } else {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.lineWidth = drawSettings.brushSize;

        if (drawSettings.tool === 'highlighter') {
            drawCtx.globalAlpha = 0.3;
        } else {
            drawCtx.globalAlpha = drawSettings.opacity / 100;
        }

        drawCtx.strokeStyle = drawSettings.color;
    }

    drawCtx.lineTo(x, y);
    drawCtx.stroke();

    // Smooth drawing
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
}

function stopDrawing() {
    if (isDrawing) {
        WorkspaceState.markUnsaved();

        // Broadcast stroke to collaborators (if not receiving remote stroke)
        if (!isRemoteDrawing && currentStrokePoints.length > 1 && window.workspaceCollaboration) {
            window.workspaceCollaboration.emitDrawingStroke(
                currentStrokePoints,
                drawSettings.color,
                drawSettings.brushSize,
                drawSettings.opacity / 100,
                drawSettings.tool
            );
        }
    }
    isDrawing = false;
    currentStrokePoints = [];
    if (drawCtx) {
        drawCtx.globalAlpha = 1.0;
        drawCtx.beginPath();
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (drawCanvas && drawCtx) {
        const imageData = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
        drawCanvas.width = window.innerWidth;
        drawCanvas.height = window.innerHeight;
        drawCtx.putImageData(imageData, 0, 0);
    }
});

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Save button
    document.getElementById('project-save-btn')?.addEventListener('click', () => {
        WorkspaceState.save();
    });

    // Sticky Note FAB
    document.getElementById('fab-sticky')?.addEventListener('click', () => {
        WorkspaceState.createStickyNote();
    });

    // Draw FAB
    document.getElementById('fab-draw')?.addEventListener('click', () => {
        togglePopup('draw-popup');
        if (!drawingInitialized) initDrawingTool();
    });

    // Chat & Notes FABs
    document.getElementById('fab-chat')?.addEventListener('click', () => togglePopup('chat-popup'));
    document.getElementById('fab-notes')?.addEventListener('click', () => togglePopup('notes-popup'));

    // Notes Popup Actions
    document.getElementById('btn-save-note')?.addEventListener('click', async () => await window.workspaceNotes?.manualSave());
    document.getElementById('btn-screenshot')?.addEventListener('click', async () => await window.workspaceNotes?.attachScreenshot());
    document.getElementById('btn-new-note')?.addEventListener('click', async () => await window.workspaceNotes?.createNewNote());
    document.getElementById('btn-pdf-export')?.addEventListener('click', async () => await window.workspaceNotes?.exportToPDF());

    // Initialize after a small delay to ensure DOM is ready
    setTimeout(() => {
        if (!drawingInitialized) initDrawingTool();
        WorkspaceState.init();
    }, 100);
});
