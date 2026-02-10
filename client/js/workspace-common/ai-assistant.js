/**
 * AI Assistant - Chat and summarization functionality
 */

export class AIAssistant {
    constructor(options = {}) {
        this.containerId = options.containerId || 'ai-assistant-panel';
        this.workspaceContext = options.workspaceContext || 'general';
        this.getContextData = options.getContextData || (() => ({}));
        this.apiEndpoint = options.apiEndpoint || '/api/chat';
        this.onMessage = options.onMessage || (() => { });
        this.onError = options.onError || ((error) => console.error('AI error:', error));

        this.messages = [];
        this.isProcessing = false;

        this.init();
    }

    /**
     * Initialize AI assistant
     */
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with id '${this.containerId}' not found`);
            return;
        }

        // Load message history from localStorage
        this.loadHistory();

        // Render initial messages
        this.renderMessages();

        console.log('AI Assistant initialized');
    }

    /**
     * Send a message to the AI
     */
    async sendMessage(text) {
        if (!text || !text.trim()) return;

        // Add user message
        const userMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };

        this.messages.push(userMessage);
        this.renderMessages();
        this.saveHistory();

        // Show typing indicator
        this.isProcessing = true;
        this.showTypingIndicator();

        try {
            // Get context data
            const context = this.getContextData();

            // Send to AI
            const aiResponse = await this.callAI(text, context);

            // Add AI message
            const aiMessage = {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            };

            this.messages.push(aiMessage);
            this.onMessage(aiMessage);
        } catch (error) {
            // Add error message
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, an error occurred. Please try again.',
                timestamp: new Date().toISOString(),
                isError: true
            };

            this.messages.push(errorMessage);
            this.onError(error);
        } finally {
            this.isProcessing = false;
            this.hideTypingIndicator();
            this.renderMessages();
            this.saveHistory();
        }
    }

    /**
     * Call AI API
     */
    async callAI(message, context = {}) {
        // Check if we have a chatbot API available (from chatbot.js)
        if (window.chatbotAPI && typeof window.chatbotAPI.sendMessage === 'function') {
            return await window.chatbotAPI.sendMessage(message);
        }

        // Fallback to mock response for now
        console.warn('AI API not available, using mock response');
        return this.getMockResponse(message, context);
    }

    /**
     * Get mock AI response (for testing without backend)
     */
    getMockResponse(message, context) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = [
                    `You are asking about ${this.workspaceContext}! What specific details are you curious about?`,
                    `Good question. I will help you with ${this.workspaceContext} related topics.`,
                    `Understood. The project seems to be progressing well.`,
                    `Let me know if you need more detailed information!`
                ];

                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                resolve(randomResponse);
            }, 1000);
        });
    }

    /**
     * Summarize current workspace state
     */
    async summarize() {
        const context = this.getContextData();
        const prompt = `Please summarize the current status of the ${this.workspaceContext} project: ${JSON.stringify(context)}`;

        return await this.sendMessage(prompt);
    }

    /**
     * Explain a concept
     */
    async explain(concept) {
        const prompt = `Please explain "${concept}" regarding ${this.workspaceContext}.`;

        return await this.sendMessage(prompt);
    }

    /**
     * Get suggestions
     */
    async getSuggestions() {
        const context = this.getContextData();
        const prompt = `Please provide improvement suggestions for the current ${this.workspaceContext} project: ${JSON.stringify(context)}`;

        return await this.sendMessage(prompt);
    }

    /**
     * Render messages in the chat interface
     */
    renderMessages() {
        const chatHistory = document.getElementById('chat-messages');
        if (!chatHistory) return;

        chatHistory.innerHTML = '';

        this.messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.className = `chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;

            if (msg.isError) {
                messageEl.classList.add('error-message');
            }

            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';
            contentEl.textContent = msg.content;

            messageEl.appendChild(contentEl);
            chatHistory.appendChild(messageEl);
        });

        // Scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const chatHistory = document.getElementById('chat-messages');
        if (!chatHistory) return;

        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'chat-message ai-message typing';
        indicator.innerHTML = '<div class="typing-dots"><span>.</span><span>.</span><span>.</span></div>';

        chatHistory.appendChild(indicator);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Clear chat history
     */
    clearHistory() {
        this.messages = [];
        this.renderMessages();
        this.saveHistory();
    }

    /**
     * Save chat history to localStorage
     */
    saveHistory() {
        try {
            const key = `simvex_ai_history_${this.workspaceContext}`;
            localStorage.setItem(key, JSON.stringify(this.messages));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    /**
     * Load chat history from localStorage
     */
    loadHistory() {
        try {
            const key = `simvex_ai_history_${this.workspaceContext}`;
            const saved = localStorage.getItem(key);

            if (saved) {
                this.messages = JSON.parse(saved);
            } else {
                // Add welcome message
                this.messages = [{
                    role: 'assistant',
                    content: `Hello! I am Dongdongi, helping you with ${this.workspaceContext}. How can I help you?`,
                    timestamp: new Date().toISOString()
                }];
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            this.messages = [];
        }
    }

    /**
     * Export chat history
     */
    exportHistory() {
        const text = this.messages.map(msg => {
            const time = new Date(msg.timestamp).toLocaleString('en-US');
            const role = msg.role === 'user' ? 'User' : 'Dongdongi';
            return `[${time}] ${role}: ${msg.content}`;
        }).join('\n\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-chat-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Destroy AI assistant
     */
    destroy() {
        this.saveHistory();
    }
}

/**
 * Create an AI assistant instance
 */
export function createAIAssistant(options) {
    return new AIAssistant(options);
}
