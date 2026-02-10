document.addEventListener('DOMContentLoaded', () => {
    const chatbotFab = document.getElementById('chatbotFab');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');

    let isOpen = false;
    let chatHistory = []; // Context for API

    // Toggle Chat Window
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatbotWindow.classList.add('open');
            chatbotFab.classList.add('active');
            chatInput.focus();
            // Scroll to bottom
            scrollToBottom();

            // If empty, add greeting if not already there
            if (chatMessages.children.length === 0) {
                addBotMessage("Hello! I am your assistant Dongdongi. How can I help you? 😊");
                addSuggestionChips();
            }
        } else {
            chatbotWindow.classList.remove('open');
            chatbotFab.classList.remove('active');
        }
    }

    chatbotFab.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', () => {
        isOpen = false;
        chatbotWindow.classList.remove('open');
        chatbotFab.classList.remove('active');
    });

    // Send Message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Clear input
        chatInput.value = '';

        // Add User Message
        addUserMessage(message);

        // Show Typing Indicator
        const typingId = showTypingIndicator();

        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    history: chatHistory
                })
            });

            const data = await response.json();

            // Remove Typing Indicator
            removeTypingIndicator(typingId);

            if (data.success) {
                addBotMessage(data.data.content);
                // Update history
                chatHistory.push({ role: 'user', content: message });
                chatHistory.push({ role: 'assistant', content: data.data.content });
                // Keep history limited to last 10 messages context
                if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
            } else {
                addBotMessage("Sorry, a temporary issue occurred. Please try again. 😥");
                console.error(data.message);
            }
        } catch (error) {
            removeTypingIndicator(typingId);
            addBotMessage("A network error occurred. Please check your internet connection.");
            console.error(error);
        }
    }

    // Event Listeners for Input
    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Helper Functions
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message user';
        msgDiv.innerHTML = `
      <div class="message-content">${formatText(text)}</div>
      <span class="message-time">${getCurrentTime()}</span>
    `;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function addBotMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot';
        msgDiv.innerHTML = `
      <div class="message-content">${formatText(text)}</div>
      <span class="message-time">${getCurrentTime()}</span>
    `;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function addSuggestionChips() {
        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'welcome-cards';

        const questions = [
            "How to use SIMVEX",
            "How to create a new project?",
            "Explain collaboration features"
        ];

        questions.forEach(q => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.textContent = q;
            chip.onclick = () => {
                chatInput.value = q;
                sendMessage();
                chipsContainer.style.display = 'none'; // Hide suggestions after click
            };
            chipsContainer.appendChild(chip);
        });

        // Insert after the greeting (which is the last child)
        chatMessages.lastElementChild.insertAdjacentElement('afterend', chipsContainer);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'typing-indicator';
        div.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
        chatMessages.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function formatText(text) {
        // Simple text formatting: convert newlines to <br>
        // Escape HTML to prevent XSS
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
});
