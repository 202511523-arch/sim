/**
 * Workspace Chatbot Logic
 * Integrated with Gemini API and local fallback
 */
window.WorkspaceChatbot = class WorkspaceChatbot {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        this.input = document.getElementById(config.inputId);
        this.sendBtn = document.getElementById(config.sendButtonId);
        this.pageId = config.pageId || 'study_main';
        this.init();
    }

    init() {
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.handleChat());
        }
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleChat();
            });
        }
    }

    appendMessage(role, text) {
        if (!this.container) return;
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}`;

        const isAI = role === 'ai' || role === 'assistant';
        bubble.style.cssText = `
            background: ${isAI ? 'rgba(255,255,255,0.05)' : '#4facfe'};
            color: ${isAI ? '#ddd' : 'white'};
            padding: 12px 15px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.5;
            align-self: ${isAI ? 'flex-start' : 'flex-end'};
            max-width: 85%;
            border: ${isAI ? '1px solid rgba(255,255,255,0.1)' : 'none'};
            box-shadow: ${isAI ? 'none' : '0 4px 15px rgba(79, 172, 254, 0.3)'};
            margin-bottom: 10px;
        `;
        bubble.textContent = text;
        this.container.appendChild(bubble);
        this.container.scrollTop = this.container.scrollHeight;
    }

    async handleChat() {
        if (!this.input) return;
        const query = this.input.value.trim();
        if (!query) return;

        this.appendMessage('user', query);
        this.input.value = '';

        // Add thinking indicator
        const thinkingId = 'thinking-' + Date.now();
        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = thinkingId;
        thinkingDiv.style.cssText = 'color: #888; font-size: 12px; margin-bottom: 8px; font-style: italic; padding-left: 10px;';
        thinkingDiv.textContent = 'AI is generating a response...';
        this.container.appendChild(thinkingDiv);
        this.container.scrollTop = this.container.scrollHeight;

        const apiKey = localStorage.getItem('gemini_api_key');

        if (apiKey) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `The user is currently studying chemistry (Current chapter: ${this.pageId}). Please answer the following question like a friendly chemistry teacher: ${query}` }] }]
                    })
                });
                const data = await response.json();

                if (document.getElementById(thinkingId)) document.getElementById(thinkingId).remove();

                if (data.candidates && data.candidates[0].content.parts[0].text) {
                    const text = data.candidates[0].content.parts[0].text;
                    this.appendMessage('ai', text);
                } else {
                    this.appendMessage('ai', "Sorry, I couldn't generate a response.");
                }
            } catch (error) {
                console.error('Gemini error:', error);
                if (document.getElementById(thinkingId)) document.getElementById(thinkingId).remove();
                this.appendMessage('ai', "An error occurred. Please check if your API key is correct.");
            }
        } else {
            // Fallback to local logic if no API key
            await new Promise(r => setTimeout(r, 1000));
            if (document.getElementById(thinkingId)) document.getElementById(thinkingId).remove();

            let answer = "Currently in educational simulation mode. I can help if you ask about specific chemical principles or molecular properties. (Tip: Set your API key in the Dashboard for a smarter AI experience!)";

            const moleculeData = {
                'water': 'Water (H₂O) is a polar molecule with a bent structure consisting of one oxygen and two hydrogen atoms. Its boiling point is 100°C and it is essential for life.',
                'methane': 'Methane (CH₄) is the simplest organic compound, with one carbon and four hydrogens bonded in a tetrahedral shape. It is the primary component of natural gas.',
                'ethanol': 'Ethanol (C₂H₅OH) is a type of alcohol used in disinfectants, fuel, and is also found in alcoholic beverages.',
                'benzene': 'Benzene (C₆H₆) is an aromatic hydrocarbon with a hexagonal ring structure and a very stable resonance structure.',
                'ammonia': 'Ammonia (NH₃) is a molecule with one nitrogen and three hydrogens in a trigonal pyramidal shape, widely used in fertilizer production.',
                'carbon dioxide': 'Carbon dioxide (CO₂) is a non-polar molecule with one carbon and two oxygens in a linear arrangement, and is a major greenhouse gas.'
            };

            for (const key in moleculeData) {
                if (query.includes(key)) {
                    answer = moleculeData[key];
                    break;
                }
            }

            if (query.includes('hi') || query.includes('hello')) {
                answer = "Hello! I am your AI tutor here to help with your chemistry studies. How can I assist you today?";
            }

            this.appendMessage('ai', answer);
        }
    }
};
