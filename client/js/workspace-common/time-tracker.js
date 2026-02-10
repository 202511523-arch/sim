/**
 * Time Tracker
 * Tracks user engagement time in the workspace and sends heartbeats to the server.
 */
class TimeTracker {
    constructor() {
        this.pingInterval = 60 * 1000; // 1 minute
        this.sessionId = null;
        this.isActive = true;
        this.projectId = this.getProjectIdFromUrl();
        this.category = this.getCategoryFromUrl();

        if (this.projectId) {
            this.init();
        } else {
            console.warn('TimeTracker: No Project ID parsing from URL. Tracking disabled.');
        }
    }

    getProjectIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    getCategoryFromUrl() {
        // Assume URL structure: /category/index.html?id=...
        const path = window.location.pathname;
        const parts = path.split('/');
        // parts might be ["", "chemistry", "index.html"] or ["", "simvex", "client", "chemistry", "index.html"]
        // Let's rely on the project data fetch or just pass it if known.
        // Or simpler: grab the parent directory name
        if (parts.length >= 2) {
            // If local file or specific path, try to find known categories
            const categories = ['chemistry', 'mechanical', 'biology', 'medicine', 'earth', 'engineering'];
            for (const cat of categories) {
                if (path.includes(cat)) return cat;
            }
        }
        return 'unknown';
    }

    async init() {
        // Handle visibility change (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            this.isActive = !document.hidden;
            if (this.isActive) {
                this.ping(); // Ping immediately on resume
            }
        });

        // Start session
        await this.startSession();

        // Start heartbeat loop
        setInterval(() => {
            if (this.isActive && this.sessionId) {
                this.ping();
            }
        }, this.pingInterval);
    }

    async startSession() {
        try {
            // Check if api is available (it should be loaded)
            if (!window.api) {
                console.error('TimeTracker: window.api not found. Make sure api.js is loaded.');
                return;
            }

            const res = await window.api.request('/sessions/start', 'POST', {
                projectId: this.projectId,
                category: this.category
            });

            if (res.success) {
                this.sessionId = res.data.sessionId;
                console.log('TimeTracker: Session started', this.sessionId);
            }
        } catch (error) {
            console.error('TimeTracker: Failed to start session', error);
        }
    }

    async ping() {
        if (!this.sessionId) return;

        try {
            const res = await window.api.request('/sessions/heartbeat', 'POST', {
                sessionId: this.sessionId,
                projectId: this.projectId // Redundant but good for fallback
            });

            if (res.success) {
                console.debug(`TimeTracker: Heartbeat sent. Duration: ${res.data.duration}m`);
            }
        } catch (error) {
            console.warn('TimeTracker: Heartbeat failed', error);
            // If 404/Invalid session, maybe restart?
            // For now, keep silent to avoid flood
        }
    }
}

// Auto-initialize
window.addEventListener('DOMContentLoaded', () => {
    // Only init if api is ready, or wait for it
    if (window.api) {
        window.timeTracker = new TimeTracker();
    } else {
        // Wait a bit or hook into some event? 
        // Usually api.js is loaded in head or before body end.
        setTimeout(() => {
            if (window.api) window.timeTracker = new TimeTracker();
        }, 1000);
    }
});
