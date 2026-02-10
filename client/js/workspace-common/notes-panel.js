/**
 * Notes Panel - Enhanced Rich Text note-taking (Quill.js)
 */
export class NotesPanel {
    constructor(options = {}) {
        this.containerId = options.containerId || 'notes-panel';
        this.textareaId = options.textareaId || 'notepad';
        this.autoSave = options.autoSave !== false;
        this.autoSaveDelay = options.autoSaveDelay || 2000;
        this.storageKey = options.storageKey || 'simvex_notes';
        this.onSave = options.onSave || (() => { });
        this.onChange = options.onChange || (() => { });

        this.content = '';
        this.saveTimer = null;
        this.textarea = null;
        this.quill = null;

        this.init();
    }

    async init() {
        this.textarea = document.getElementById(this.textareaId);

        if (!this.textarea) {
            console.error(`Textarea with id '${this.textareaId}' not found`);
            return;
        }

        // Load dependencies
        await Promise.all([
            this.loadScript('https://cdn.quilljs.com/1.3.6/quill.js'),
            this.loadStyle('https://cdn.quilljs.com/1.3.6/quill.snow.css')
        ]);

        this.initQuill();
        this.load();
    }

    initQuill() {
        const container = document.createElement('div');
        container.id = `${this.textareaId}-quill`;
        container.style.height = '100%';
        container.style.background = 'transparent';
        container.style.border = 'none';

        this.textarea.parentNode.insertBefore(container, this.textarea);
        this.textarea.style.display = 'none';

        this.quill = new Quill(container, {
            theme: 'snow',
            placeholder: 'Enter notes...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['clean']
                ]
            }
        });

        this.quill.on('text-change', () => {
            this.content = this.quill.root.innerHTML;
            this.onChange(this.content);
            if (this.autoSave) {
                this.debouncedSave();
            }
        });
    }

    getContent() {
        return this.content;
    }

    setContent(content) {
        this.content = content || '';
        if (this.quill) {
            this.quill.root.innerHTML = this.content;
        } else if (this.textarea) {
            this.textarea.value = this.content;
        }
    }

    clear() {
        this.setContent('');
        this.save();
    }

    debouncedSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(() => {
            this.save();
        }, this.autoSaveDelay);
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, this.content);
            this.onSave(this.content);
            return true;
        } catch (error) {
            console.error('Failed to save notes:', error);
            return false;
        }
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.setContent(saved);
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }

    loadScript(src) {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    loadStyle(href) {
        return new Promise((resolve) => {
            if (document.querySelector(`link[href="${href}"]`)) return resolve();
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            document.head.appendChild(link);
        });
    }

    insertText(text) {
        if (!this.quill) return;
        const range = this.quill.getSelection() || { index: this.quill.getLength(), length: 0 };
        this.quill.insertText(range.index, text);
    }

    destroy() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.save();
    }
}

export function createNotesPanel(options) {
    return new NotesPanel(options);
}
