/*
* Study Helper UI Manager
* Ties together notes and chatbot logic.
*/
window.StudyHelper = (function () {
    let chatbot = null;
    let notes = null;

    function init() {
        const pageId = window.location.pathname.split('/').pop() || 'study_main';

        // 1. Initialize Tabs
        const tabNote = document.getElementById('tab-note');
        const tabAI = document.getElementById('tab-ai');
        const contentNote = document.getElementById('content-note');
        const contentAI = document.getElementById('content-ai');

        if (tabNote && tabAI && contentNote && contentAI) {
            tabNote.addEventListener('click', () => {
                tabNote.classList.add('active');
                tabNote.style.color = 'white';
                tabAI.classList.remove('active');
                tabAI.style.color = 'var(--text-muted)';
                contentNote.style.display = 'flex';
                contentAI.style.display = 'none';
            });

            tabAI.addEventListener('click', () => {
                tabAI.classList.add('active');
                tabAI.style.color = 'white';
                tabNote.classList.remove('active');
                tabNote.style.color = 'var(--text-muted)';
                contentAI.style.display = 'flex';
                contentNote.style.display = 'none';
            });
        }

        // 2. Initialize Sub-modules
        if (window.WorkspaceNotes) {
            notes = new window.WorkspaceNotes({
                notepadId: 'study-note',
                pageId: pageId
            });
            window.studyNotes = notes; // Global access for inline onclick
        }

        if (window.WorkspaceChatbot) {
            chatbot = new window.WorkspaceChatbot({
                containerId: 'ai-chat-history',
                inputId: 'ai-input',
                sendButtonId: 'ai-send-btn',
                pageId: pageId
            });
        }

        console.log('Study Helper initialized for', pageId);
    }

    // Export clear function for backward compatibility with onclick="clearNote()"
    function clearNote() {
        if (notes) notes.clear();
    }

    return {
        init,
        clearNote
    };
})();

// Re-map clearNote for existing onclick handlers
window.clearNote = window.StudyHelper.clearNote;

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.StudyHelper.init();
});
