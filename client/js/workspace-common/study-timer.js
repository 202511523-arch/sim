/**
 * Study Timer Component
 * Tracks study time and syncs with server sessions
 */

class StudyTimer {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.workspace = options.workspace || 'general';
        this.category = options.category || 'biology';
        this.containerId = options.containerId;

        this.sessionId = null;
        this.startTime = null;
        this.totalPausedTime = 0; // Track total time spent paused
        this.pauseStartTime = null; // Track when the current pause started
        this.duration = 0; // minutes
        this.timerInterval = null;
        this.heartbeatInterval = null;
        this.isPaused = false;

        this.init();
    }

    async init() {
        this.renderUI();
        await this.startSession();
        this.startTimer();
    }

    renderUI() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Prevent duplicate initialization
        if (container.querySelector('.study-timer')) return;

        // Create Timer UI
        const timerDiv = document.createElement('div');
        timerDiv.className = 'study-timer';
        timerDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            margin-right: 16px;
        `;

        timerDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-icons-round" style="color: #4ade80; font-size: 20px;">timer</span>
                <span id="study-timer-display" style="font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 14px; color: #fff;">00:00:00</span>
            </div>
            <button id="study-timer-toggle" style="
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                display: flex;
                align-items: center;
                padding: 4px;
                border-radius: 50%;
                transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                <span class="material-icons-round" style="font-size: 20px;">pause</span>
            </button>
        `;

        container.appendChild(timerDiv);

        // Event Listeners
        const toggleBtn = timerDiv.querySelector('#study-timer-toggle');
        toggleBtn.addEventListener('click', () => this.togglePause());
    }

    async startSession() {
        try {
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            if (!token) return;

            const response = await fetch('/api/sessions/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    projectId: this.projectId,
                    category: this.category
                })
            });

            const data = await response.json();
            if (data.success) {
                this.sessionId = data.data.sessionId;
                this.startTime = Date.now();
                this.startHeartbeat();
            }
        } catch (error) {
            console.error('Failed to start session:', error);
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        // Update display every second
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;

            this.updateDisplay();
        }, 1000);
    }

    startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        // Sync with server every minute
        this.heartbeatInterval = setInterval(async () => {
            if (this.isPaused || !this.sessionId) return;

            try {
                const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
                if (!token) return;

                await fetch('/api/sessions/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sessionId: this.sessionId
                    })
                });
            } catch (error) {
                console.error('Heartbeat failed:', error);
            }
        }, 60000); // 1 minute
    }

    updateDisplay() {
        if (!this.startTime) return;

        const now = Date.now();
        // SUBTRACT TOTAL PAUSED TIME
        const diff = now - this.startTime - this.totalPausedTime;

        // Calculate hours, minutes, seconds
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const display = document.getElementById('study-timer-display');
        if (display) {
            display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.querySelector('#study-timer-toggle span');
        const display = document.getElementById('study-timer-display');

        if (this.isPaused) {
            // Track when pause started
            this.pauseStartTime = Date.now();

            if (btn) btn.textContent = 'play_arrow';
            if (display) display.style.opacity = '0.5';
        } else {
            // Calculate duration of THIS pause
            if (this.pauseStartTime) {
                const pauseDuration = Date.now() - this.pauseStartTime;
                this.totalPausedTime += pauseDuration;
                this.pauseStartTime = null;
            }

            if (btn) btn.textContent = 'pause';
            if (display) display.style.opacity = '1';

            // Update immediately
            this.updateDisplay();
        }
    }
}
