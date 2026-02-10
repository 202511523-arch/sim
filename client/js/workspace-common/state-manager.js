/**
 * State Manager - Handles project state persistence
 * Supports both localStorage (client-side) and API (server-side) storage
 */

export class StateManager {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.serialize = options.serialize || (() => ({}));
        this.deserialize = options.deserialize || (() => { });
        this.onSave = options.onSave || (() => { });
        this.onLoad = options.onLoad || (() => { });
        this.onError = options.onError || ((error) => console.error('State error:', error));

        this.autoSaveEnabled = options.autoSave !== false;
        this.autoSaveInterval = options.autoSaveInterval || 30000; // 30 seconds
        this.useLocalStorage = options.useLocalStorage !== false;
        this.useAPI = options.useAPI || false;

        this.isDirty = false;
        this.isSaving = false;
        this.lastSaveTime = null;
        this.autoSaveTimer = null;

        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }

        // Listen for page unload to save
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                this.saveSync(); // Synchronous save before unload
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /**
     * Mark state as dirty (needs saving)
     */
    markDirty() {
        this.isDirty = true;
    }

    /**
     * Save current state
     */
    async save() {
        if (this.isSaving) {
            console.log('Save already in progress, skipping...');
            return false;
        }

        try {
            this.isSaving = true;
            const state = this.serialize();

            // Add metadata
            const stateWithMeta = {
                ...state,
                _meta: {
                    projectId: this.projectId,
                    savedAt: new Date().toISOString(),
                    version: state.version || '1.0'
                }
            };

            // Save to localStorage
            if (this.useLocalStorage) {
                this.saveToLocalStorage(stateWithMeta);
            }

            // Save to API
            if (this.useAPI && this.projectId) {
                await this.saveToAPI(stateWithMeta);
            }

            this.isDirty = false;
            this.lastSaveTime = new Date();
            this.onSave(stateWithMeta);

            console.log('State saved successfully');
            return true;
        } catch (error) {
            this.onError(error);
            return false;
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * Synchronous save (for beforeunload)
     */
    saveSync() {
        if (!this.useLocalStorage) return;

        try {
            const state = this.serialize();
            const stateWithMeta = {
                ...state,
                _meta: {
                    projectId: this.projectId,
                    savedAt: new Date().toISOString(),
                    version: state.version || '1.0'
                }
            };

            this.saveToLocalStorage(stateWithMeta);
            this.isDirty = false;
        } catch (error) {
            console.error('Sync save failed:', error);
        }
    }

    /**
     * Load state
     */
    async load() {
        try {
            let state = null;

            // Try API first
            if (this.useAPI && this.projectId) {
                state = await this.loadFromAPI();
            }

            // Fallback to localStorage
            if (!state && this.useLocalStorage) {
                state = this.loadFromLocalStorage();
            }

            if (state) {
                // Remove metadata before deserializing
                const { _meta, ...actualState } = state;
                this.deserialize(actualState);
                this.isDirty = false;
                this.lastSaveTime = _meta?.savedAt ? new Date(_meta.savedAt) : null;
                this.onLoad(actualState);
                console.log('State loaded successfully');
                return actualState;
            } else {
                console.log('No saved state found');
                return null;
            }
        } catch (error) {
            this.onError(error);
            return null;
        }
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage(state) {
        const key = this.getLocalStorageKey();
        try {
            localStorage.setItem(key, JSON.stringify(state));
            console.log('Saved to localStorage:', key);
        } catch (error) {
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded, clearing old data...');
                this.clearOldLocalStorageData();
                // Try again
                localStorage.setItem(key, JSON.stringify(state));
            } else {
                throw error;
            }
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        const key = this.getLocalStorageKey();
        const data = localStorage.getItem(key);

        if (data) {
            try {
                return JSON.parse(data);
            } catch (error) {
                console.error('Failed to parse localStorage data:', error);
                return null;
            }
        }

        return null;
    }

    /**
     * Save to API
     */
    async saveToAPI(state) {
        if (!window.api) {
            console.warn('API client not available');
            return;
        }

        try {
            await window.api.updateProject(this.projectId, { state });
            console.log('Saved to API');
        } catch (error) {
            console.error('Failed to save to API:', error);
            throw error;
        }
    }

    /**
     * Load from API
     */
    async loadFromAPI() {
        if (!window.api) {
            console.warn('API client not available');
            return null;
        }

        try {
            const project = await window.api.getProject(this.projectId);
            return project?.state || null;
        } catch (error) {
            console.error('Failed to load from API:', error);
            return null;
        }
    }

    /**
     * Get localStorage key
     */
    getLocalStorageKey() {
        return this.projectId
            ? `simvex_project_${this.projectId}`
            : 'simvex_workspace_state';
    }

    /**
     * Clear old localStorage data
     */
    clearOldLocalStorageData() {
        const keys = Object.keys(localStorage);
        const simvexKeys = keys.filter(k => k.startsWith('simvex_project_'));

        // Sort by age and remove oldest
        simvexKeys.forEach(key => {
            if (key !== this.getLocalStorageKey()) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const age = Date.now() - new Date(data._meta?.savedAt || 0).getTime();

                    // Remove if older than 7 days
                    if (age > 7 * 24 * 60 * 60 * 1000) {
                        localStorage.removeItem(key);
                        console.log('Removed old localStorage item:', key);
                    }
                } catch (e) {
                    // Invalid data, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Start auto-save
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(() => {
            if (this.isDirty && !this.isSaving) {
                console.log('Auto-saving...');
                this.save();
            }
        }, this.autoSaveInterval);
    }

    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * Clear saved state
     */
    clear() {
        if (this.useLocalStorage) {
            const key = this.getLocalStorageKey();
            localStorage.removeItem(key);
            console.log('Cleared localStorage');
        }

        this.isDirty = false;
        this.lastSaveTime = null;
    }

    /**
     * Get time since last save
     */
    getTimeSinceLastSave() {
        if (!this.lastSaveTime) return null;
        return Date.now() - this.lastSaveTime.getTime();
    }

    /**
     * Format last save time for display
     */
    getLastSaveText() {
        if (!this.lastSaveTime) return '';

        const diff = this.getTimeSinceLastSave();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) {
            return 'Saved just now';
        } else if (minutes < 60) {
            return `Saved ${minutes} mins ago`;
        } else if (hours < 24) {
            return this.lastSaveTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }) + ' Saved';
        } else {
            return this.lastSaveTime.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) + ' Saved';
        }
    }

    /**
     * Destroy state manager
     */
    destroy() {
        this.stopAutoSave();

        // Save one last time if dirty
        if (this.isDirty) {
            this.saveSync();
        }
    }
}

/**
 * Create a simple state manager instance
 */
export function createStateManager(options) {
    return new StateManager(options);
}
