/**
 * Biology Quiz Component
 * Handles quiz generation, display, and scoring using static data
 */

class BiologyQuiz {
    constructor() {
        this.quizData = typeof BIOLOGY_QUIZ_DATA !== 'undefined' ? BIOLOGY_QUIZ_DATA : [];
        this.currentQuestions = [];
        this.userAnswers = [];

        this.init();
    }

    init() {
        // Will be initialized when button is clicked
    }

    startQuiz() {
        if (this.quizData.length === 0) {
            alert('Quiz data not loaded.');
            return;
        }

        // Select 5 random questions
        this.currentQuestions = this.getRandomQuestions(5);
        this.userAnswers = new Array(5).fill(null);
        this.displayQuizUI();
    }

    getRandomQuestions(count) {
        const shuffled = [...this.quizData].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    displayQuizUI() {
        const questionsHTML = this.currentQuestions.map((q, qIdx) => `
            <div class="quiz-question" style="margin-bottom: 24px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <div style="font-weight: 600; margin-bottom: 12px; font-size: 16px; color: #fff;">${qIdx + 1}. ${q.question}</div>
                <div class="quiz-options" style="display: flex; flex-direction: column; gap: 8px;">
                    ${q.options.map((option, optIdx) => `
                        <label class="quiz-option" style="
                            padding: 12px;
                            background: rgba(255,255,255,0.05);
                            border: 1px solid rgba(255,255,255,0.1);
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            color: #cbd5e1;
                        " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="if (!this.querySelector('input').checked) this.style.background='rgba(255,255,255,0.05)'">
                            <input type="radio" name="bio-quiz-q-${qIdx}" value="${optIdx}" style="margin: 0; accent-color: #0088ff;">
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        const content = `
            <div style="max-height: 500px; overflow-y: auto; padding-right: 8px;">
                ${questionsHTML}
            </div>
            <button id="bio-quiz-submit" style="
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #0088FF 0%, #00C2FF 100%);
                border: none;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                margin-top: 20px;
                transition: transform 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                Submit Quiz
            </button>
        `;

        this.showModal('Biology Knowledge Check', content, (modal) => {
            // Track answers
            modal.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const questionIdx = parseInt(e.target.name.split('-')[3]);
                    this.userAnswers[questionIdx] = parseInt(e.target.value);

                    // Visual feedback
                    const parent = e.target.closest('.quiz-options');
                    parent.querySelectorAll('.quiz-option').forEach(opt => {
                        opt.style.background = 'rgba(255,255,255,0.05)';
                        opt.style.borderColor = 'rgba(255,255,255,0.1)';
                    });
                    e.target.parentElement.style.background = 'rgba(0, 136, 255, 0.15)';
                    e.target.parentElement.style.borderColor = 'rgba(0, 136, 255, 0.5)';
                });
            });

            const submitBtn = modal.querySelector('#bio-quiz-submit');
            submitBtn.addEventListener('click', () => this.submitQuiz());
        });
    }

    submitQuiz() {
        let correctCount = 0;
        let answeredCount = 0;

        this.userAnswers.forEach(ans => {
            if (ans !== null) answeredCount++;
        });

        if (answeredCount < 5) {
            if (!confirm('You haven\'t answered all questions. Submit anyway?')) return;
        }

        const results = this.currentQuestions.map((q, idx) => {
            const userAnswer = this.userAnswers[idx];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect) correctCount++;
            return {
                question: q,
                userAnswer: userAnswer,
                isCorrect: isCorrect
            };
        });

        const score = Math.round((correctCount / 5) * 100);
        this.showResults(score, results);
    }

    showResults(score, results) {
        const resultHTML = results.map((r, idx) => {
            const { question, userAnswer, isCorrect } = r;
            const userAnsText = userAnswer !== null ? question.options[userAnswer] : 'No Answer';
            const correctAnsText = question.options[question.correctAnswer];

            return `
                <div style="margin-bottom: 20px; padding: 16px; background: ${isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}; border-radius: 8px;">
                    <div style="font-weight: 600; margin-bottom: 8px; color: #fff;">
                        ${idx + 1}. ${question.question}
                        <span style="float: right; color: ${isCorrect ? '#4ade80' : '#f87171'}">${isCorrect ? 'Correct' : 'Incorrect'}</span>
                    </div>
                    <div style="margin-bottom: 8px; color: #cbd5e1;">
                        <span>Your Answer:</span> <span style="font-weight:500;">${userAnsText}</span>
                    </div>
                    ${!isCorrect ? `<div style="margin-bottom: 8px; color: #cbd5e1;"><span>Correct Answer:</span> <span style="font-weight:500; color: #4ade80;">${correctAnsText}</span></div>` : ''}
                    <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">${question.explanation}</div>
                </div>
            `;
        }).join('');

        const content = `
            <div style="text-align: center; padding: 24px; background: linear-gradient(135deg, rgba(0,136,255,0.1) 0%, rgba(0,194,255,0.1) 100%); border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(0,136,255,0.2);">
                <div style="font-size: 42px; font-weight: 700; color: #fff; margin-bottom: 4px;">${score} Points</div>
                <div style="font-size: 16px; color: rgba(255,255,255,0.7);">${Math.round((score / 100) * 5)} / 5 Correct</div>
            </div>
            <div style="max-height: 400px; overflow-y: auto; padding-right: 8px;">
                ${resultHTML}
            </div>
            <button class="modal-close-btn-bottom" style="
                width: 100%;
                padding: 12px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                margin-top: 16px;
                transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                Close
            </button>
        `;

        this.showModal('Quiz Results', content, (modal) => {
            modal.querySelector('.modal-close-btn-bottom').addEventListener('click', () => {
                const modalEl = document.getElementById('bio-quiz-modal');
                if (modalEl) modalEl.remove();
            });
        });
    }

    showModal(title, content, onShow) {
        // Remove existing
        const existing = document.getElementById('bio-quiz-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'bio-quiz-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            animation: fadeIn 0.2s;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="
                background: #0f1623;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                width: 90%;
                max-width: 600px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s;
            ">
                <div class="modal-header" style="
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0; font-size: 18px; color: #fff;">${title}</h3>
                    <button class="modal-close" style="
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.5);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px; overflow-y: auto;">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);

        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        if (onShow) onShow(modal);
    }
}
