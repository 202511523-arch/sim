/**
 * Workspace Notes Logic
 */
window.WorkspaceNotes = class WorkspaceNotes {
    constructor(config) {
        this.textarea = document.getElementById(config.notepadId);
        this.pageId = config.pageId || 'study_main';
        this.storageKey = `note_${this.pageId}`;

        const saved = localStorage.getItem(this.storageKey);
        this.content = saved || '';

        this.init();
    }

    init() {
        if (this.textarea) {
            this.textarea.value = this.content;
            this.textarea.addEventListener('input', () => this.save());
        }
    }

    save() {
        const content = this.textarea.value;
        this.content = content;
        localStorage.setItem(this.storageKey, content);
    }

    clear() {
        if (confirm('Are you sure you want to clear all notes?')) {
            this.textarea.value = '';
            this.save();
        }
    }

    async exportToPDF() {
        alert('PDF export function is under development.');
    }
};
