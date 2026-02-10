/**
 * WorkspaceNotes - Enhanced note management with Rich Text (Quill), Screen Capture (html2canvas) and Cropping (Cropper.js)
 */
class WorkspaceNotes {
    constructor({ workspace, projectId, notepadId = 'notepad' }) {
        this.workspace = workspace;
        this.projectId = projectId;
        this.notepad = document.getElementById(notepadId);
        this.currentNoteId = null;
        this.noteSelector = document.getElementById('note-selector');
        this.noteTitleInput = document.getElementById('note-title-input');

        // Auto-save title change
        if (this.noteTitleInput) {
            this.noteTitleInput.oninput = () => {
                if (this.currentNoteId) {
                    clearTimeout(this.saveTimeout);
                    this.saveTimeout = setTimeout(() => this.saveCurrentNote(), 2000);
                }
            };
        }

        this.notes = []; // All notes for this workspace
        this.attachments = [];
        this.autoSaveTimer = null;
        this.quill = null;
        this.cropper = null;

        this.init();
    }

    resolveUrl(url) {
        if (url && url.startsWith('/') && !url.startsWith('http')) {
            return `https://simvexdong.onrender.com${url}`;
        }
        return url;
    }

    getWorkspaceName(ws) {
        // Return capitalized workspace name or map if needed
        return ws.charAt(0).toUpperCase() + ws.slice(1);
    }

    // Add content to the current note (e.g., from AI Chatbot)
    appendContent(text) {
        if (this.quill) {
            const range = this.quill.getSelection() || { index: this.quill.getLength(), length: 0 };
            const separator = this.quill.getLength() > 1 ? '\n\n' : '';
            this.quill.insertText(range.index, separator + text);
            this.saveCurrentNote(true);
            this.showSaveIndicator('Added to note');
        } else {
            const currentContent = this.notepad.value;
            const separator = currentContent.trim() ? '\n\n' : '';
            this.notepad.value = currentContent + separator + text;
            this.saveCurrentNote(true);
            this.showSaveIndicator('Added to note');
        }
    }

    getAuthHeaders() {
        const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async init() {
        // Load external libraries
        await Promise.all([
            this.loadScript('https://cdn.quilljs.com/1.3.6/quill.js'),
            this.loadStyle('https://cdn.quilljs.com/1.3.6/quill.snow.css'),
            this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
            this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js'),
            this.loadStyle('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css')
        ]);

        this.initQuill();

        // Load all notes for this workspace
        this.loadNotes();

        // Create note list UI
        this.createNoteListUI();
    }

    initQuill() {
        if (document.getElementById('quill-editor')) return;

        const container = document.createElement('div');
        container.id = 'quill-editor';
        container.style.height = '100%';
        this.notepad.parentNode.insertBefore(container, this.notepad);
        this.notepad.style.display = 'none';

        this.quill = new Quill('#quill-editor', {
            theme: 'snow',
            placeholder: 'Enter notes...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean'],
                    ['image']
                ]
            }
        });

        // Track if we're receiving remote updates (to avoid broadcast loops)
        this.isRemoteUpdate = false;
        this.emitDebounceTimer = null;

        this.quill.on('text-change', (delta, oldDelta, source) => {
            // Only broadcast if this is a user change, not a remote sync
            if (source === 'user' && !this.isRemoteUpdate) {
                clearTimeout(this.autoSaveTimer);
                this.autoSaveTimer = setTimeout(() => this.saveCurrentNote(true), 5000);

                // Debounced emit to collaborators (every 300ms max)
                clearTimeout(this.emitDebounceTimer);
                this.emitDebounceTimer = setTimeout(() => {
                    this.emitNoteUpdate();
                }, 300);
            }
        });

        // Setup real-time collaboration listeners
        this.setupCollaborationListeners();
    }

    /**
     * Emit note update to other collaborators via WorkspaceCollaboration
     */
    emitNoteUpdate() {
        if (!window.workspaceCollaboration) {
            console.log('⚠️ WorkspaceCollaboration not available for note sync');
            return;
        }

        const content = this.quill ? this.quill.root.innerHTML : this.notepad.value;
        const title = this.noteTitleInput ? this.noteTitleInput.value : '';

        console.log('📤 Emitting note update:', { noteId: this.currentNoteId, titleLength: title.length, contentLength: content.length });

        window.workspaceCollaboration.emitNoteUpdate(
            this.currentNoteId || 'new-note',
            content,
            title
        );
    }

    /**
     * Setup real-time collaboration listeners for notes
     */
    setupCollaborationListeners() {
        // Wait for collaboration to be ready
        const checkCollab = setInterval(() => {
            if (window.workspaceCollaboration) {
                clearInterval(checkCollab);

                // Listen for note updates from other users
                window.workspaceCollaboration.onNoteUpdate((data) => {
                    // Only apply if it's for the same note we're editing
                    if (data.noteId === this.currentNoteId ||
                        (this.currentNoteId === null && data.noteId === 'new-note')) {

                        // Prevent broadcast loop
                        this.isRemoteUpdate = true;

                        // Save cursor position
                        const selection = this.quill?.getSelection();

                        // Update content
                        if (this.quill) {
                            this.quill.root.innerHTML = data.content;
                        } else if (this.notepad) {
                            this.notepad.value = data.content;
                        }

                        // Update title
                        if (data.title && this.noteTitleInput) {
                            this.noteTitleInput.value = data.title;
                        }

                        // Restore cursor position
                        if (selection && this.quill) {
                            setTimeout(() => {
                                this.quill.setSelection(selection.index, selection.length);
                            }, 0);
                        }

                        // Show who made the update
                        window.workspaceCollaboration.showSyncNotification('note', data.userName);

                        this.isRemoteUpdate = false;
                    }
                });

                console.log('📝 Notes real-time collaboration enabled');
            }
        }, 500);

        // Clear after 10 seconds if not found
        setTimeout(() => clearInterval(checkCollab), 10000);
    }

    createNoteListUI() {
        const header = document.querySelector('#notes-popup .popup-header');
        if (!header) return;

        if (document.querySelector('.note-selector-container')) return;

        // Container for note selector and title input
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'note-selector-container';
        selectorContainer.style.cssText = `
            padding: 8px 12px;
            background: rgba(0,0,0,0.2);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        const select = document.createElement('select');
        select.id = 'note-selector';
        select.style.cssText = `
            flex: 1;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 13px;
        `;
        select.addEventListener('change', (e) => this.loadNote(e.target.value));
        this.noteSelector = select; // Store reference

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.id = 'note-title-input';
        titleInput.placeholder = 'Enter note title...';
        titleInput.style.cssText = `
            width: 100%;
            padding: 4px 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 4px;
            font-size: 13px;
        `;
        this.noteTitleInput = titleInput; // Store reference

        // Auto-save title change
        this.noteTitleInput.oninput = () => {
            if (this.currentNoteId) {
                clearTimeout(this.saveTimeout);
                this.saveTimeout = setTimeout(() => this.saveCurrentNote(true), 2000); // silent auto-save
            }
        };

        // Insert after header
        header.parentNode.insertBefore(selectorContainer, header.nextSibling);
        selectorContainer.appendChild(select);
        selectorContainer.appendChild(titleInput);
    }

    updateNoteSelector() {
        if (!this.noteSelector) return;

        const currentId = this.currentNoteId;
        this.noteSelector.innerHTML = '<option value="">-- Create New Note --</option>' +
            this.notes.map(n => {
                const title = n.title || new Date(n.updatedAt || n.createdAt).toLocaleString();
                return `<option value="${n._id}" ${n._id === currentId ? 'selected' : ''}>${title}</option>`;
            }).join('');
    }

    // createAttachmentPreview removed as per user request to avoid duplicate image display

    async loadNotes() {
        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            const isValidObjectId = this.projectId && /^[0-9a-fA-F]{24}$/.test(this.projectId);
            const queryParams = isValidObjectId
                ? `?projectId=${this.projectId}&workspace=${this.workspace}&limit=50`
                : `?workspace=${this.workspace}&limit=50`;

            const response = await fetch(`/api/notes${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (result.success && result.data.notes.length > 0) {
                this.notes = result.data.notes;
                this.loadNote(this.notes[0]._id);
            } else {
                this.notes = [];
                this.currentNoteId = null;
                if (this.quill) this.quill.setContents([]);
                if (this.noteTitleInput) this.noteTitleInput.value = '';
                this.attachments = [];
                // this.renderAttachments(); // Removed
            }
            this.updateNoteSelector();
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }

    async loadNote(noteId) {
        if (!noteId) {
            this.createNewNote();
            return;
        }

        const note = this.notes.find(n => n._id === noteId);
        if (!note) return;

        this.currentNoteId = note._id;

        if (this.quill) {
            // Check if content looks like Quill Delta or HTML
            if (note.content && note.content.startsWith('{"ops"')) {
                this.quill.setContents(JSON.parse(note.content));
            } else {
                this.quill.clipboard.dangerouslyPasteHTML(note.content || '');
            }
        } else {
            this.notepad.value = note.content || '';
        }
        if (this.noteTitleInput) this.noteTitleInput.value = note.title || "";
        this.attachments = note.attachments || [];
        // this.renderAttachments(); // Removed
        this.updateNoteSelector();
    }

    renderAttachments() {
        // Disabled UI rendering as per user request (images already appear inside Quill editor)
        // We keep the internal this.attachments array for storage and PDF export.
    }

    removeAttachment(index) {
        this.attachments.splice(index, 1);
        this.renderAttachments();
        this.saveCurrentNote();
    }

    async saveCurrentNote(silent = false) {
        const content = this.quill ? this.quill.root.innerHTML : this.notepad.value.trim();
        const noteTitle = this.noteTitleInput ? this.noteTitleInput.value.trim() : "";
        const title = noteTitle || `Personal Note (${new Date().toLocaleDateString()})`;

        // Don't save if totally empty and it's a new note
        if (!this.currentNoteId && this.quill && this.quill.getText().trim().length === 0 && this.attachments.length === 0 && !noteTitle) return;

        try {
            const isValidObjectId = this.projectId && /^[0-9a-fA-F]{24}$/.test(this.projectId);
            const noteData = {
                content,
                workspace: this.workspace,
                linkedProjectId: isValidObjectId ? this.projectId : null,
                title: title,
                attachments: this.attachments
            };

            let response;
            if (this.currentNoteId) {
                response = await fetch(`/api/notes/${this.currentNoteId}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(noteData)
                });
            } else {
                response = await fetch('/api/notes', {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(noteData)
                });
            }

            const result = await response.json();
            if (result.success) {
                this.currentNoteId = result.data.note._id;
                this.attachments = result.data.note.attachments || [];

                const existingIndex = this.notes.findIndex(n => n._id === this.currentNoteId);
                if (existingIndex >= 0) {
                    this.notes[existingIndex] = result.data.note;
                } else {
                    this.notes.unshift(result.data.note);
                }

                this.updateNoteSelector();
                if (!silent) this.showSaveIndicator();
                return true;
            } else {
                this.showErrorIndicator(result.message || 'Save failed');
                return false;
            }
        } catch (error) {
            console.error('Failed to save note:', error);
            this.showErrorIndicator('Network error');
            return false;
        }
    }

    async attachScreenshot() {
        this.showSaveIndicator('Capturing full screen...', '#4facfe');

        try {
            // Take screenshot of the whole body
            const canvas = await html2canvas(document.body, {
                useCORS: true,
                logging: false,
                ignoreElements: (el) => {
                    // Ignore popups and toast and cropper
                    return el.classList.contains('popup-panel') || el.id === 'save-indicator' || el.id === 'cropper-overlay';
                },
                onclone: (clonedDoc) => {
                    // Check if there are iframes (Sketchfab) and warn they might be blank
                    const iframes = clonedDoc.querySelectorAll('iframe');
                    iframes.forEach(iframe => {
                        const warning = clonedDoc.createElement('div');
                        warning.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px; border-radius:10px; z-index:1000; text-align:center; font-family:sans-serif;';
                        warning.innerHTML = '<span class="material-icons-round" style="display:block; font-size:40px; margin-bottom:10px;">warning</span>3D models (Sketchfab) cannot be captured directly due to security policies.<br>Please drag to capture the desired area.';
                        iframe.parentNode.style.position = 'relative';
                        iframe.parentNode.appendChild(warning);
                    });
                }
            });

            this.showCropper(canvas.toDataURL('image/png'));
        } catch (error) {
            console.error('Screenshot failed:', error);
            alert('Screenshot failed: ' + error.message);
        }
    }

    showCropper(imageData) {
        // Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'cropper-overlay';
        overlay.innerHTML = `
            <div class="cropper-container-wrapper">
                <img id="cropper-image" src="${imageData}">
            </div>
            <div class="cropper-controls">
                <button class="btn-secondary" id="cropper-cancel">Cancel</button>
                <button class="btn-primary" id="cropper-apply">
                    <span class="material-icons-round">crop</span>
                    Apply & Insert
                </button>
            </div>
        `;
        document.body.appendChild(overlay);

        const image = document.getElementById('cropper-image');
        this.cropper = new Cropper(image, {
            viewMode: 1,
            autoCropArea: 0.8,
        });

        document.getElementById('cropper-cancel').onclick = () => {
            overlay.remove();
            this.cropper.destroy();
        };

        document.getElementById('cropper-apply').onclick = async () => {
            this.showSaveIndicator('Processing image...', '#4facfe');
            const croppedCanvas = this.cropper.getCroppedCanvas();

            croppedCanvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('image', blob, `crop-${Date.now()}.png`);

                try {
                    const response = await fetch('/api/upload/screenshot', {
                        method: 'POST',
                        headers: { 'Authorization': this.getAuthHeaders()['Authorization'] },
                        body: formData
                    });

                    const result = await response.json();
                    if (result.success) {
                        const screenshot = result.data;
                        const url = this.resolveUrl(screenshot.url);

                        // Insert into editor
                        if (this.quill) {
                            const range = this.quill.getSelection() || { index: this.quill.getLength(), length: 0 };
                            this.quill.insertEmbed(range.index, 'image', url);
                        }

                        // Also add to attachments for safety/listing
                        this.attachments.push({
                            url: screenshot.url,
                            filename: screenshot.filename,
                            mimetype: screenshot.mimetype,
                            size: screenshot.size
                        });

                        // this.renderAttachments(); // Removed
                        await this.saveCurrentNote();
                        this.showSaveIndicator('Image inserted!');
                    }
                } catch (error) {
                    console.error('Crop upload failed:', error);
                    alert('Image upload failed');
                } finally {
                    overlay.remove();
                    this.cropper.destroy();
                }
            }, 'image/png');
        };
    }

    async createNewNote() {
        this.currentNoteId = null;
        if (this.quill) this.quill.setContents([]);
        if (this.noteTitleInput) this.noteTitleInput.value = '';
        this.attachments = [];
        // this.renderAttachments(); // Removed
        if (this.quill) this.quill.focus();
        this.updateNoteSelector();
        this.showSaveIndicator('Create New Note');
    }

    async generateAISummary(content) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    message: `Please summarize the following study note content and organize key points:\n\n${content}`,
                    history: [],
                    workspace: this.workspace
                })
            });
            const data = await response.json();
            if (data.success) return data.data.content;
            return null;
        } catch (error) {
            console.error('AI summary failed:', error);
            return null;
        }
    }

    async exportToPDF() {
        const contentText = this.quill ? this.quill.getText().trim() : '';
        if (!this.currentNoteId && !contentText && (!this.noteTitleInput || !this.noteTitleInput.value.trim())) {
            alert('Cannot export empty note.');
            return;
        }

        this.showSaveIndicator('Generating PDF... (including AI summary)', '#9c27b0');

        try {
            // Get AI Summary
            let summary = '';
            if (contentText.length > 10) {
                this.showSaveIndicator('AI is analyzing the note...', '#9c27b0');
                summary = await this.generateAISummary(contentText);
            }

            const container = document.createElement('div');
            container.style.cssText = `
				position: fixed; top: -9999px; left: -9999px; width: 800px;
				background: white; color: black; font-family: sans-serif;
				z-index: 10000; padding: 0; box-sizing: border-box;
			`;

            const pdfStyles = `
				<style>
					.pdf-page { padding: 40px; width: 100%; box-sizing: border-box; background: white; }
					.ql-editor { padding: 0 !important; width: 100% !important; overflow: visible !important; }
					.ql-editor img {
						max-width: 100% !important;
						height: auto !important;
						display: block;
						margin: 10px auto !important;
						object-fit: contain;
					}
					p, h1, h2, h3, h4 { margin-bottom: 0.5em; line-height: 1.5; word-break: break-all; }
					.header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
					.ai-summary { background: #f3f4f6; border-left: 4px solid #4f46e5; padding: 12px; margin-bottom: 20px; border-radius: 4px; }
					img { max-width: 100% !important; height: auto !important; }
				</style>
			`;

            const date = new Date().toLocaleString('en-US');
            const wsName = this.getWorkspaceName(this.workspace);
            const noteTitle = this.noteTitleInput ? this.noteTitleInput.value.trim() : '';
            const displayTitle = noteTitle || `${wsName} Summary Note`;

            let htmlContent = `
				<div class="pdf-page">
					<div class="header">
						<h1 style="margin: 0; color: #333; font-size: 26px;">${wsName} Summary Note</h1>
						<p style="margin: 5px 0 0; color: #666; font-size: 14px;">${date}</p>
					</div>
			`;

            if (summary) {
                htmlContent += `
					<div class="ai-summary">
						<h3 style="margin: 0 0 10px; color: #4f46e5; font-size: 16px;">✨ AI Summary</h3>
						<p style="margin: 0; line-height: 1.6; font-size: 14px; color: #374151;">${summary.replace(/\\n/g, '<br>')}</p>
					</div>
				`;
            }

            const editorHtml = this.quill ? this.quill.root.innerHTML : '';
            htmlContent += `
				<div style="margin-bottom: 30px;">
					<h2 style="font-size: 20px; color: #111; margin-bottom: 15px;">${displayTitle}</h2>
					<div class="ql-editor">${editorHtml}</div>
				</div>
			</div>
			`;

            // Images (Already embedded in HTML if used Quill, but attachments are separate)
            if (this.attachments.length > 0) {
                // Only show attachments that aren't already in the editor HTML to avoid duplicates
                const uniqueAttachments = this.attachments.filter(att => !editorHtml.includes(att.url));
                if (uniqueAttachments.length > 0) {
                    htmlContent += `
                        <div class="pdf-page">
                            <h3 style="margin: 0 0 15px; color: #333; font-size: 18px;">Attached Images</h3>
                            <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                    `;

                    for (const att of uniqueAttachments) {
                        htmlContent += `
                            <div style="border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px;">
                                <img src="${this.resolveUrl(att.url)}" style="max-width: 100%; height: auto; display: block;" crossOrigin="anonymous">
                            </div>
                        `;
                    }
                    htmlContent += `</div></div>`;
                }
            }

            container.innerHTML = pdfStyles + htmlContent;
            document.body.appendChild(container);

            // Wait for images to load
            await Promise.all(
                Array.from(container.querySelectorAll('img')).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                })
            );

            // Render to canvas
            const canvas = await window.html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Generate PDF
            if (typeof window.jspdf === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png'); // Use PNG for better quality
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }

            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const time = now.toLocaleTimeString('en-US', { hour12: false });
            const fileName = `[${year}. ${month}. ${day}. ${time}] ${this.getWorkspaceName(this.workspace)} Summary Note.pdf`;
            doc.save(fileName);

            // Cleanup
            document.body.removeChild(container);
            this.showSaveIndicator('PDF Download Complete!');

        } catch (error) {
            console.error('PDF export failed:', error);
            alert('PDF Creation Failed: ' + error.message);
            this.showErrorIndicator('PDF Creation Failed');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadStyle(href) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`link[href="${href}"]`)) return resolve();
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    showSaveIndicator(message = 'Saved ✓', bgColor = 'rgba(0, 240, 255, 0.95)') {
        const existing = document.getElementById('save-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.id = 'save-indicator';
        indicator.textContent = message;
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 50%;
            transform: translateX(50%);
            background: ${bgColor};
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 3000);
    }

    showErrorIndicator(message) {
        this.showSaveIndicator(message, 'rgba(255, 50, 50, 0.95)');
    }

    manualSave() {
        clearTimeout(this.autoSaveTimer);
        return this.saveCurrentNote();
    }
}

// Export for use in workspaces
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkspaceNotes;
}
