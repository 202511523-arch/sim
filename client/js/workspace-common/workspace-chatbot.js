/**
 * Workspace Chatbot Module
 * Provides AI assistant functionality for each workspace
 */

class WorkspaceChatbot {
    constructor(options = {}) {
        this.workspace = options.workspace || 'general';
        this.containerId = options.containerId || 'ai-panel';
        this.inputId = options.inputId || 'omni-input';
        this.sendButtonId = options.sendButtonId || 'omni-send';
        this.projectId = options.projectId || null;
        this.chatHistory = [];
        this.currentChatId = null;

        this.container = null;
        this.messagesDiv = null;
        this.input = null;
        this.sendButton = null;

        this.init();
    }

    init() {
        // Get elements
        this.container = document.getElementById(this.containerId);
        this.input = document.getElementById(this.inputId);
        this.sendButton = document.getElementById(this.sendButtonId);

        if (!this.container || !this.input || !this.sendButton) {
            console.warn('Workspace chatbot: Required elements not found');
            return;
        }

        // Find or create messages container
        this.messagesDiv = this.container.querySelector('#chat-messages') ||
            this.container.querySelector('.chat-messages');

        if (!this.messagesDiv) {
            this.messagesDiv = document.createElement('div');
            this.messagesDiv.id = 'chat-messages';
            this.messagesDiv.style.cssText = 'display: flex; flex-direction: column; gap: 12px; overflow-y: auto; height: 100%;';
            this.container.appendChild(this.messagesDiv);
        }

        // Add history controls
        this.addHistoryControls();

        // Setup event listeners
        this.setupEventListeners();

        // Try to load recent chat history
        this.loadRecentChat();
    }

    setupEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    addHistoryControls() {
        // Add buttons above messages area
        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = 'display: flex; gap: 8px; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);';
        controlsDiv.innerHTML = `
            <button id="new-chat-btn" style="flex: 1; padding: 6px; background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.3); border-radius: 6px; color: rgba(0,240,255,0.9); cursor: pointer; font-size: 12px;">
                <span class="material-icons-round" style="font-size: 14px; vertical-align: middle;">add</span> New Chat
            </button>
            <button id="save-chat-btn" style="flex: 1; padding: 6px; background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.3); border-radius: 6px; color: rgba(0,240,255,0.9); cursor: pointer; font-size: 12px;">
                <span class="material-icons-round" style="font-size: 14px; vertical-align: middle;">save</span> Save
            </button>
            <button id="load-chat-btn" style="flex: 1; padding: 6px; background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.3); border-radius: 6px; color: rgba(0,240,255,0.9); cursor: pointer; font-size: 12px;">
                <span class="material-icons-round" style="font-size: 14px; vertical-align: middle;">history</span> Load
            </button>
        `;

        this.container.insertBefore(controlsDiv, this.messagesDiv);

        document.getElementById('new-chat-btn').addEventListener('click', () => this.newChat());
        document.getElementById('save-chat-btn').addEventListener('click', () => this.saveChat());
        document.getElementById('load-chat-btn').addEventListener('click', () => this.showChatHistoryModal());
    }

    addWelcomeMessage() {
        const welcomeMessages = {
            chemistry: 'Hello! I am your Chemistry AI assistant. Ask me anything about molecular structures or chemical reactions!',
            mechanical: 'Hello! I am your Mechanical Engineering AI assistant. I can help with CAD design and simulations!',
            engineering: 'Hello! I am your Engineering AI assistant. I can help with design and simulations!',
            biology: 'Hello! I am your Biology AI assistant. Ask me anything about biological phenomena!',
            medicine: 'Hello! I am your Medicine AI assistant. I can help you learn about the human body and medicine!',
            medical: 'Hello! I am your Medicine AI assistant. I can help you learn about the human body and medicine!',
            earthscience: 'Hello! I am your Earth Science AI assistant. Ask me anything about the universe and Earth!',
            math: 'Hello! I am your Math AI assistant. Ask me about vectors, derivatives, integrals, or any mathematical concepts!',
            general: 'Hello! I am your AI assistant. Ask me anything!'
        };

        const message = welcomeMessages[this.workspace] || welcomeMessages.general;
        this.addBotMessage(message);
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Clear input
        this.input.value = '';

        // Add user message to UI
        this.addUserMessage(message);

        // Show typing indicator
        const typingId = this.showTypingIndicator();

        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    history: this.chatHistory,
                    workspace: this.workspace
                })
            });

            const data = await response.json();

            // Remove typing indicator
            this.removeTypingIndicator(typingId);

            if (data.success) {
                this.addBotMessage(data.data.content);

                // Update history
                this.chatHistory.push({ role: 'user', content: message });
                this.chatHistory.push({ role: 'assistant', content: data.data.content });

                // Keep history limited
                if (this.chatHistory.length > 20) {
                    this.chatHistory = this.chatHistory.slice(-20);
                }

                // Auto-save to DB
                this.autoSaveChat();
            } else {
                this.addBotMessage('Sorry, an error occurred while generating the response. Please try again. 😥');
                console.error('Chat error:', data.message);
            }
        } catch (error) {
            this.removeTypingIndicator(typingId);
            this.addBotMessage('Network error. Please check server connection.');
            console.error('Chat error:', error);
        }
    }

    addUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 12px; margin-left: auto; max-width: 80%;';
        msgDiv.innerHTML = `
            <div style="font-size: 14px; line-height: 1.5;">${this.escapeHtml(text)}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px; text-align: right;">${this.getCurrentTime()}</div>
        `;
        this.messagesDiv.appendChild(msgDiv);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 12px; max-width: 80%;';
        msgDiv.innerHTML = `
            <div style="font-size: 14px; line-height: 1.5;">${this.formatText(text)}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <div style="font-size: 11px; color: rgba(255,255,255,0.5);">${this.getCurrentTime()}</div>
                <button class="btn-add-note" style="
                    background: rgba(255,255,255,0.1); 
                    border: none; 
                    border-radius: 4px; 
                    color: rgba(255,255,255,0.8); 
                    font-size: 11px; 
                    padding: 2px 6px; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    gap: 4px;
                    transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    <span class="material-icons-round" style="font-size: 12px;">edit_note</span>
                    Add to Note
                </button>
            </div>
        `;

        // Add click handler for the button
        const btn = msgDiv.querySelector('.btn-add-note');
        if (btn) {
            btn.addEventListener('click', () => this.addToNote(text));
        }

        this.messagesDiv.appendChild(msgDiv);
        this.scrollToBottom();
    }

    addToNote(text) {
        if (window.workspaceNotes) {
            window.workspaceNotes.appendContent(text);
        } else {
            console.warn('WorkspaceNotes not found');
            alert('Note feature is unavailable.');
        }
    }

    showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.style.cssText = 'display: flex; gap: 4px; padding: 12px; max-width: 80px;';
        div.innerHTML = `
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5); animation: typing-bounce 1.4s infinite ease-in-out;"></div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5); animation: typing-bounce 1.4s infinite ease-in-out 0.2s;"></div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5); animation: typing-bounce 1.4s infinite ease-in-out 0.4s;"></div>
        `;

        // Add animation style if not exists
        if (!document.getElementById('typing-animation-style')) {
            const style = document.createElement('style');
            style.id = 'typing-animation-style';
            style.textContent = `
                @keyframes typing-bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }

        this.messagesDiv.appendChild(div);
        this.scrollToBottom();
        return id;
    }

    removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    scrollToBottom() {
        if (this.messagesDiv) {
            this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatText(text) {
        // Convert markdown-style formatting
        let formatted = this.escapeHtml(text);
        formatted = formatted.replace(/\n/g, '<br>');
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        return formatted;
    }

    // New chat session
    newChat() {
        this.currentChatId = null;
        this.chatHistory = [];
        this.messagesDiv.innerHTML = '';
        this.addWelcomeMessage();
    }

    // Auto-save current chat to DB
    async autoSaveChat() {
        if (this.chatHistory.length === 0) return;

        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    workspace: this.workspace,
                    projectId: this.projectId,
                    messages: this.chatHistory,
                    chatId: this.currentChatId
                })
            });

            const data = await response.json();
            if (data.success) {
                this.currentChatId = data.data.chat._id;
            }
        } catch (error) {
            console.error('Auto-save chat failed:', error);
        }
    }

    // Manual save
    async saveChat() {
        if (this.chatHistory.length === 0) {
            this.showToast('No chat to save.', 'warning');
            return;
        }

        await this.autoSaveChat();
        this.showToast('Chat saved successfully!', 'success');
    }

    // Toast Notification
    showToast(message, type = 'success') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `chatbot-toast ${type}`;
        toast.innerHTML = `
            <span class="material-icons-round">${type === 'success' ? 'check_circle' : 'info'}</span>
            <span>${message}</span>
        `;

        // Style the toast (glassmorphism)
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-20px)',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 24px',
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            zIndex: '10000',
            opacity: '0',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
        });

        // Add specific color for icon based on type
        const icon = toast.querySelector('.material-icons-round');
        if (type === 'success') icon.style.color = '#4ade80'; // Green
        if (type === 'warning') icon.style.color = '#fbbf24'; // Amber

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Load recent chat automatically
    async loadRecentChat() {
        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            if (!token) {
                this.addWelcomeMessage();
                return;
            }

            const params = new URLSearchParams({
                workspace: this.workspace,
                limit: 1
            });
            if (this.projectId) params.append('projectId', this.projectId);

            const response = await fetch(`/api/chats?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success && data.data.chats.length > 0) {
                const latestChat = data.data.chats[0];
                await this.loadChat(latestChat._id);
            } else {
                this.addWelcomeMessage();
            }
        } catch (error) {
            console.error('Load recent chat failed:', error);
            this.addWelcomeMessage();
        }
    }

    // Load specific chat by ID
    async loadChat(chatId) {
        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            const response = await fetch(`/api/chats/${chatId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                const chat = data.data.chat;
                this.currentChatId = chat._id;
                this.chatHistory = chat.messages;
                this.messagesDiv.innerHTML = '';

                // Render messages
                chat.messages.forEach(msg => {
                    if (msg.role === 'user') {
                        this.addUserMessage(msg.content);
                    } else if (msg.role === 'assistant') {
                        this.addBotMessage(msg.content);
                    }
                });
            }
        } catch (error) {
            console.error('Load chat failed:', error);
        }
    }

    // Show chat history in modal popup
    async showChatHistoryModal() {
        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            const params = new URLSearchParams({
                workspace: this.workspace,
                limit: 20
            });
            if (this.projectId) params.append('projectId', this.projectId);

            const response = await fetch(`/api/chats?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (!data.success || data.data.chats.length === 0) {
                this.showModal('No saved chats', '<p style="text-align:center; color: rgba(255,255,255,0.6);">There are no saved chat histories yet.</p>');
                return;
            }

            // Create modal content with chat list
            const chatListHTML = data.data.chats.map((chat, idx) => {
                const date = new Date(chat.updatedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const title = chat.title || 'No Title';
                return `
                    <div class="chat-history-item" data-chat-id="${chat._id}" style="
                        padding: 12px;
                        margin-bottom: 8px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(0,240,255,0.1)'; this.style.borderColor='rgba(0,240,255,0.3)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='rgba(255,255,255,0.1)';">
                        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.5);">${date}</div>
                    </div>
                `;
            }).join('');

            this.showModal('Chat History', `
                <div style="max-height: 400px; overflow-y: auto;">
                    ${chatListHTML}
                </div>
            `, (modal) => {
                // Add click handlers
                modal.querySelectorAll('.chat-history-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const chatId = item.getAttribute('data-chat-id');
                        await this.loadChat(chatId);
                        this.closeModal();
                    });
                });
            });
        } catch (error) {
            console.error('Show chat history failed:', error);
            this.showModal('Error', '<p>An error occurred while loading chat history.</p>');
        }
    }

    // Generic modal display function
    showModal(title, content, onShow) {
        // Remove existing modal if any
        this.closeModal();

        const modal = document.createElement('div');
        modal.id = 'chat-history-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="
                background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
                border: 1px solid rgba(0,240,255,0.3);
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,240,255,0.2);
                animation: slideUp 0.3s;
            ">
                <div class="modal-header" style="
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0; font-size: 18px;">${title}</h3>
                    <button class="modal-close" style="
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.6);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 6px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='white';" onmouseout="this.style.background='none'; this.style.color='rgba(255,255,255,0.6)';">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    ${content}
                </div>
            </div>
        `;

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(modal);

        // Close handlers
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Custom onShow callback
        if (onShow) onShow(modal);
    }

    closeModal() {
        const modal = document.getElementById('chat-history-modal');
        if (modal) modal.remove();
    }
}

// Export for use in workspaces
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorkspaceChatbot };
}
