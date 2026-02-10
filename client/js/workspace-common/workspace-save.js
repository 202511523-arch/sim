/**
 * Unified Workspace Save Manager
 * Saves all workspace state to the project in the database
 */

class WorkspaceSaveManager {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.workspace = options.workspace || 'general';
        this.autoSaveInterval = options.autoSaveInterval || 30000; // 30 seconds
        this.saveButtonId = options.saveButtonId;

        this.lastSaved = null;
        this.autoSaveTimer = null;
        this.stateGetter = null; // Function to get current workspace state

        this.init();
    }

    init() {
        if (!this.projectId) {
            console.warn('WorkspaceSaveManager: No projectId provided');
            return;
        }

        // Setup save button if provided
        if (this.saveButtonId) {
            const saveBtn = document.getElementById(this.saveButtonId);
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveNow());
            }
        }

        // Setup auto-save
        if (this.autoSaveInterval > 0) {
            this.startAutoSave();
        }

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveNow(true); // Sync save
        });
    }

    // Register a function that returns the current workspace state
    registerStateGetter(getter) {
        this.stateGetter = getter;
    }

    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(() => {
            this.saveNow();
        }, this.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    async saveNow(sync = false) {
        if (!this.projectId) {
            console.warn('Cannot save: No projectId');
            return { success: false };
        }

        try {
            // Get current workspace state
            const state = this.stateGetter ? this.stateGetter() : {};

            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            if (!token) {
                console.warn('Cannot save: No auth token');
                return { success: false };
            }

            const payload = {
                workspace: this.workspace,
                state: state,
                lastModified: new Date().toISOString()
            };

            const response = await fetch(`/api/projects/${this.projectId}/workspace-state`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                this.lastSaved = new Date();
                this.updateSaveStatus('Saved');
                return { success: true };
            } else {
                this.updateSaveStatus('Save Failed');
                console.error('Save failed:', data.message);
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Save error:', error);
            this.updateSaveStatus('Save Error');
            return { success: false, error: error.message };
        }
    }

    async loadState() {
        if (!this.projectId) {
            console.warn('Cannot load: No projectId');
            return null;
        }

        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            if (!token) {
                console.warn('Cannot load: No auth token');
                return null;
            }

            const response = await fetch(`/api/projects/${this.projectId}/workspace-state?workspace=${this.workspace}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success && data.data) {
                return data.data.state;
            }

            return null;
        } catch (error) {
            console.error('Load state error:', error);
            return null;
        }
    }

    updateSaveStatus(message) {
        // Try to update save status UI if it exists
        const statusEl = document.getElementById('save-status') ||
            document.getElementById('status-message') ||
            document.getElementById('status-message-gl');

        if (statusEl) {
            const originalText = statusEl.textContent;
            statusEl.textContent = message;
            statusEl.style.color = message.includes('Saved') ? '#22c55e' :
                message.includes('Failed') || message.includes('Error') ? '#ef4444' :
                    'rgba(255,255,255,0.6)';

            // Reset after 2 seconds
            setTimeout(() => {
                statusEl.textContent = originalText;
                statusEl.style.color = 'rgba(255,255,255,0.4)';
            }, 2000);
        }
    }

    destroy() {
        this.stopAutoSave();
    }
}

// Export for use in workspaces
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkspaceSaveManager;
}
