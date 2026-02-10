/**
 * Workspace Collaboration Manager
 * Handles real-time presence (avatars) and cursor sharing across all workspaces.
 * Enhanced with user popup and improved cursor tracking.
 */

class WorkspaceCollaboration {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.currentUser = options.currentUser || null;
        this.containerId = options.containerId || 'collaboration-users';
        this.cursorLayerId = options.cursorLayerId || 'cursor-layer';

        this.socket = null;
        this.collaborators = new Map(); // socketId -> user data
        this.cursors = new Map(); // socketId -> cursor element
        this.lastCursorUpdate = 0;
        this.popupOpen = false;

        // Configuration
        //const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.serverUrl = 'https://simvexdong.onrender.com'; // isLocal ? 'http://localhost:3000' : 'https://simvexdong.onrender.com';

        this.init();
    }

    async init() {
        if (!this.projectId) {
            console.warn('WorkspaceCollaboration: No projectId provided.');
            return;
        }

        // Create cursor layer if it doesn't exist
        this.ensureCursorLayer();

        // Create styles
        this.injectStyles();

        // Create popup
        this.createCollaboratorsPopup();

        // Fetch current user's Google profile before connecting
        await this.fetchCurrentUser();

        // Connect to Socket.io
        this.connect();

        // Setup navigation tracking (broadcast location on tab changes)
        this.setupNavTracking();
    }

    async fetchCurrentUser() {
        try {
            // Assuming 'api' is available globally from api.js
            if (typeof api !== 'undefined') {
                const response = await api.getMe();
                if (response && response.data && response.data.user) {
                    this.currentUser = response.data.user;
                    console.log('✅ Fetched current user:', this.currentUser.name, '| avatar:', this.currentUser.avatar ? '✅' : '❌ none');

                    // Fetch user's role in this project
                    try {
                        const projRes = await api.getProject(this.projectId);
                        if (projRes && projRes.data) {
                            this.currentUserRole = projRes.data.myRole || 'editor';
                            console.log('✅ Current user role:', this.currentUserRole);
                        }
                    } catch (roleErr) {
                        console.warn('Could not fetch project role:', roleErr);
                        this.currentUserRole = 'editor';
                    }

                    // Re-render UI with correct profile
                    this.renderCollaborators();
                    if (this.popupOpen) this.renderPopupContent();
                }
            }
        } catch (error) {
            console.error('Failed to fetch current user:', error);
        }
    }

    injectStyles() {
        if (document.getElementById('workspace-collab-styles')) return;

        const style = document.createElement('style');
        style.id = 'workspace-collab-styles';
        style.textContent = `
            /* Remote Cursor Styles */
            .remote-cursor {
                position: absolute;
                pointer-events: none;
                transition: transform 0.08s linear;
                z-index: 9999;
                display: flex;
                flex-direction: column;
            }
            .cursor-pointer {
                width: 0; 
                height: 0; 
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 14px solid;
                transform: rotate(-30deg);
                filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.4));
            }
            .cursor-label {
                background: rgba(0,0,0,0.75);
                color: white;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                margin-top: 2px;
                margin-left: 10px;
                backdrop-filter: blur(4px);
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            
            /* Collaborator Avatars Container */
            .collab-avatars-container {
                display: flex;
                align-items: center;
                padding-left: 8px;
                cursor: pointer;
                position: relative;
            }
            .collaborator-avatar {
                width: 32px; 
                height: 32px; 
                border-radius: 50%; 
                overflow: hidden; 
                border: 2px solid transparent; 
                margin-left: -8px; 
                position: relative; 
                z-index: 1;
                transition: all 0.2s ease;
                background: #1e293b;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .collaborator-avatar:first-child {
                margin-left: 0;
            }
            .collaborator-avatar:hover {
                transform: translateY(-3px) scale(1.1);
                z-index: 10;
            }
            .collaborator-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .more-users-badge {
                width: 32px; 
                height: 32px; 
                border-radius: 50%; 
                background: linear-gradient(135deg, #374151, #1f2937);
                color: #e5e7eb;
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 11px; 
                font-weight: 600; 
                margin-left: -8px; 
                border: 2px solid #4b5563;
                z-index: 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .online-indicator {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 10px;
                height: 10px;
                background: #22c55e;
                border-radius: 50%;
                border: 2px solid #0f172a;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            /* Collaborators Popup */
            .collab-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                display: none;
                align-items: flex-start;
                justify-content: center;
                padding-top: 80px;
                animation: fadeIn 0.2s ease;
            }
            .collab-popup-overlay.active {
                display: flex;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .collab-popup {
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98));
                border: 1px solid rgba(99, 102, 241, 0.3);
                border-radius: 16px;
                width: 340px;
                max-height: 70vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99, 102, 241, 0.1);
                animation: slideDown 0.3s ease;
            }
            @keyframes slideDown {
                from { 
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .collab-popup-header {
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(99, 102, 241, 0.1);
            }
            .collab-popup-header h3 {
                margin: 0;
                font-size: 15px;
                font-weight: 600;
                color: white;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .collab-popup-header .online-count {
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            .collab-popup-close {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                transition: all 0.2s;
                display: flex;
            }
            .collab-popup-close:hover {
                background: rgba(255,255,255,0.1);
                color: white;
            }
            .collab-popup-body {
                padding: 12px;
                max-height: 400px;
                overflow-y: auto;
            }
            .collab-user-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                border-radius: 10px;
                transition: background 0.2s;
                margin-bottom: 4px;
            }
            .collab-user-item:hover {
                background: rgba(255,255,255,0.05);
            }
            .collab-user-item .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                overflow: hidden;
                position: relative;
                flex-shrink: 0;
            }
            .collab-user-item .avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .collab-user-item .avatar .status-dot {
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 10px;
                height: 10px;
                background: #22c55e;
                border-radius: 50%;
                border: 2px solid #1e293b;
            }
            .collab-user-item .user-info {
                flex: 1;
                min-width: 0;
            }
            .collab-user-item .user-name {
                font-weight: 600;
                font-size: 14px;
                color: white;
                margin: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .collab-user-item .user-role {
                font-size: 12px;
                color: #94a3b8;
                margin: 2px 0 0;
            }
            .collab-user-item .user-cursor-color {
                width: 12px;
                height: 12px;
                border-radius: 3px;
                flex-shrink: 0;
            }
            .collab-empty-state {
                text-align: center;
                padding: 30px 20px;
                color: #64748b;
            }
            .collab-empty-state .icon {
                font-size: 40px;
                margin-bottom: 10px;
                opacity: 0.5;
            }
            .collab-empty-state p {
                margin: 0;
                font-size: 13px;
            }

            /* ===== Location Badge under Collaborator Avatar ===== */
            .collab-avatar-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
            }
            .collab-location-badge {
                position: absolute;
                bottom: -16px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.85), rgba(79, 70, 229, 0.85));
                color: #fff;
                font-size: 9px;
                font-weight: 600;
                padding: 1px 6px;
                border-radius: 6px;
                white-space: nowrap;
                pointer-events: none;
                letter-spacing: 0.3px;
                box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
                border: 1px solid rgba(255,255,255,0.15);
                animation: locationBadgeFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
                z-index: 12;
                max-width: 80px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            @keyframes locationBadgeFadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.8); }
                to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            }

            /* ===== Tab Switch Notification ===== */
            .collab-tab-switch-toast {
                position: fixed;
                top: 70px;
                right: 20px;
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.92), rgba(67, 56, 202, 0.92));
                color: white;
                padding: 8px 16px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(255,255,255,0.1);
                z-index: 10001;
                animation: tabSwitchSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
                font-size: 13px;
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255,255,255,0.15);
            }
            .collab-tab-switch-toast img {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.3);
                object-fit: cover;
            }
            .collab-tab-switch-toast .tab-icon {
                font-size: 16px;
                opacity: 0.8;
            }
            .collab-tab-switch-toast .tab-page {
                font-weight: 600;
                color: #c7d2fe;
            }
            @keyframes tabSwitchSlideIn {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes tabSwitchSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(120%); opacity: 0; }
            }

            .nav-pill {
                position: relative !important;
                transition: box-shadow 0.3s ease !important;
            }
            .nav-presence-container {
                position: absolute;
                bottom: -24px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 3px;
                pointer-events: auto;
                z-index: 100;
                animation: navPresenceFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            }
            @keyframes navPresenceFadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.8); }
                to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            }
            .nav-presence-avatar {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
                transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                cursor: pointer;
                position: relative;
                background: #1e293b;
                animation: navAvatarPulse 3s ease-in-out infinite;
            }
            @keyframes navAvatarPulse {
                0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1); }
                50% { box-shadow: 0 2px 12px rgba(0,0,0,0.5), 0 0 6px rgba(99,102,241,0.3); }
            }
            .nav-presence-avatar:hover {
                transform: scale(1.4) translateY(-2px);
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.2);
                animation: none;
            }
            .nav-presence-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            /* Tooltip for presence avatar */
            .nav-presence-avatar[data-tooltip]:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: calc(100% + 6px);
                left: 50%;
                transform: translateX(-50%);
                background: rgba(15, 23, 42, 0.95);
                color: #e2e8f0;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
                white-space: nowrap;
                pointer-events: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                border: 1px solid rgba(255,255,255,0.1);
                z-index: 200;
                animation: tooltipFadeIn 0.2s ease;
            }
            @keyframes tooltipFadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(4px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            /* Colored dot indicator under the pill */
            .nav-presence-indicator {
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                border-radius: 50%;
                animation: presenceDotPulse 2s infinite;
                z-index: 99;
            }
            @keyframes presenceDotPulse {
                0%, 100% { opacity: 1; box-shadow: 0 0 4px currentColor; }
                50% { opacity: 0.7; box-shadow: 0 0 8px currentColor; }
            }
            .nav-presence-more {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: linear-gradient(135deg, #374151, #1f2937);
                color: #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 700;
                border: 2px solid #4b5563;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }

    renderNavPresence() {
        // Clear all existing presence indicators
        document.querySelectorAll('.nav-presence-container').forEach(el => el.remove());
        document.querySelectorAll('.nav-presence-indicator').forEach(el => el.remove());

        const users = Array.from(this.collaborators.values());
        if (users.length === 0) {
            // Clean up any leftover glow from pills
            document.querySelectorAll('.nav-pill').forEach(link => {
                link.style.removeProperty('box-shadow');
            });
            return;
        }

        // Group users by which nav pill they're on
        const navLinks = document.querySelectorAll('.nav-pill');
        const pillUserMap = new Map(); // linkElement -> [users]

        users.forEach(user => {
            if (!user.currentPath) return;

            // Extract filename from the user's current path
            // e.g. "/chemistry/study.html?id=xxx" -> "study.html"
            const pathWithoutQuery = user.currentPath.split('?')[0].split('#')[0];
            const remoteFilename = pathWithoutQuery.split('/').pop() || '';

            // Also extract the module folder for more accurate matching
            // e.g. "/earthscience/constellation.html" -> ["earthscience", "constellation.html"]
            const pathParts = pathWithoutQuery.replace(/^\/+/, '').split('/');
            const remoteModule = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';
            // Extract hash for SPA-style tabs
            const remoteHash = (user.currentPath.split('#')[1] || '').toLowerCase();

            if (!remoteFilename) return;

            let matched = false;

            navLinks.forEach(link => {
                if (matched) return; // Only match one pill per user
                const href = link.getAttribute('href');
                let isMatch = false;

                // Case A: Regular Link (External or separate page)
                if (href && href !== '#' && !href.startsWith('javascript:')) {
                    // Primary: compare by filename (most reliable for relative hrefs)
                    const linkFilename = href.split('?')[0].split('#')[0].split('/').pop() || '';

                    if (linkFilename && remoteFilename) {
                        // Direct filename match
                        if (linkFilename === remoteFilename) {
                            // If both have module folders, also verify module matches
                            const linkParts = href.replace(/^\/+/, '').split('/');
                            const linkModule = linkParts.length > 1 ? linkParts[linkParts.length - 2] : '';
                            if (linkModule && remoteModule) {
                                isMatch = linkModule.toLowerCase() === remoteModule.toLowerCase();
                            } else {
                                isMatch = true;
                            }
                        }
                    }

                    // Fallback: full path comparison (for dashboard.html etc.)
                    if (!isMatch) {
                        try {
                            const linkUrl = new URL(href, window.location.href);
                            const linkPath = linkUrl.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
                            const remotePath = pathWithoutQuery.replace(/\/index\.html$/, '/').replace(/\/$/, '');
                            if (linkPath === remotePath) {
                                isMatch = true;
                            }
                        } catch (e) { }
                    }
                }
                // Case B: SPA / Hash Link (e.g. Biology internal tabs)
                else if (href === '#' || !href) {
                    // Check if we're on the same base page as the remote user
                    const localPathname = window.location.pathname.split('/').pop() || '';
                    if (localPathname === remoteFilename && remoteHash) {
                        const pillText = link.textContent.trim().toLowerCase().replace(/\s+/g, '-');
                        if (pillText === remoteHash) {
                            isMatch = true;
                        }
                    }
                }

                if (isMatch) {
                    matched = true;
                    if (!pillUserMap.has(link)) {
                        pillUserMap.set(link, []);
                    }
                    pillUserMap.get(link).push(user);
                }
            });
        });

        // Render presence avatars under each nav pill
        pillUserMap.forEach((pillUsers, link) => {
            // Highlight the pill itself with a subtle glow
            const firstUserColor = this.getUserColor(pillUsers[0].userId || pillUsers[0].socketId || pillUsers[0].id);

            // Add a colored dot indicator on the pill
            const dot = document.createElement('div');
            dot.className = 'nav-presence-indicator';
            dot.style.background = firstUserColor;
            dot.style.color = firstUserColor;
            link.appendChild(dot);

            // Add subtle glow to the pill (using setProperty to override !important from CSS)
            link.style.setProperty('box-shadow', `0 4px 12px ${firstUserColor}44, 0 0 0 1px ${firstUserColor}33`, 'important');

            // Avatar container below the pill
            const container = document.createElement('div');
            container.className = 'nav-presence-container';

            pillUsers.slice(0, 3).forEach(user => {
                const color = this.getUserColor(user.userId || user.socketId || user.id);
                const avatarSrc = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'anon'}`;

                const avatarEl = document.createElement('div');
                avatarEl.className = 'nav-presence-avatar';
                avatarEl.style.borderColor = color;
                avatarEl.setAttribute('data-tooltip', user.name || 'Anonymous');
                avatarEl.innerHTML = `<img src="${avatarSrc}" referrerpolicy="no-referrer">`;
                container.appendChild(avatarEl);
            });

            if (pillUsers.length > 3) {
                const moreEl = document.createElement('div');
                moreEl.className = 'nav-presence-more';
                moreEl.textContent = `+${pillUsers.length - 3}`;
                container.appendChild(moreEl);
            }

            link.appendChild(container);
        });

        // Clear glow from pills that don't have any users
        navLinks.forEach(link => {
            if (!pillUserMap.has(link)) {
                link.style.removeProperty('box-shadow');
            }
        });
    }

    ensureCursorLayer() {
        if (!document.getElementById(this.cursorLayerId)) {
            const layer = document.createElement('div');
            layer.id = this.cursorLayerId;
            layer.style.position = 'fixed';
            layer.style.top = '0';
            layer.style.left = '0';
            layer.style.width = '100vw';
            layer.style.height = '100vh';
            layer.style.pointerEvents = 'none';
            layer.style.zIndex = '9999';
            layer.style.overflow = 'hidden';
            document.body.appendChild(layer);
        }
    }

    createCollaboratorsPopup() {
        // Create overlay
        if (document.getElementById('collab-popup-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'collab-popup-overlay';
        overlay.className = 'collab-popup-overlay';
        overlay.innerHTML = `
            <div class="collab-popup">
                <div class="collab-popup-header">
                    <h3>
                        <span class="material-icons-round" style="font-size: 20px; color: #22c55e;">groups</span>
                        Working Together
                        <span class="online-count" id="collab-online-count">0 online</span>
                    </h3>
                    <button class="collab-popup-close" id="collab-popup-close">
                        <span class="material-icons-round">close</span>
                    </button>
                </div>
                <div class="collab-popup-body" id="collab-popup-body">
                    <div class="collab-empty-state">
                        <div class="icon">👤</div>
                        <p>You're the only one here</p>
                    </div>
                </div>
            </div>
            `;
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closePopup();
            }
        });

        // Close button
        document.getElementById('collab-popup-close').addEventListener('click', () => {
            this.closePopup();
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popupOpen) {
                this.closePopup();
            }
        });
    }

    openPopup() {
        const overlay = document.getElementById('collab-popup-overlay');
        if (overlay) {
            overlay.classList.add('active');
            this.popupOpen = true;
            this.renderPopupContent();
        }
    }

    closePopup() {
        const overlay = document.getElementById('collab-popup-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            this.popupOpen = false;
        }
    }

    renderPopupContent() {
        const body = document.getElementById('collab-popup-body');
        const countEl = document.getElementById('collab-online-count');
        if (!body) return;

        const users = Array.from(this.collaborators.values());
        const totalCount = users.length + 1; // Include self

        if (countEl) {
            countEl.textContent = `${totalCount} online`;
        }

        // Determine self avatar - prefer Google profile photo
        const selfAvatar = this.currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.currentUser?.name || 'me'}`;
        const selfName = this.currentUser?.name || 'You';
        const selfRole = this.currentUserRole || 'editor';
        const selfRoleLabel = selfRole === 'owner' ? 'Owner 👑' : selfRole.charAt(0).toUpperCase() + selfRole.slice(1);

        // Determine self page name
        const selfPageFile = window.location.pathname.split('/').pop() || 'dashboard';
        const selfPageName = selfPageFile.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        // Always show current user first (self)
        let html = `
            <div class="collab-user-item" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2);">
                <div class="avatar">
                    <img src="${selfAvatar}" referrerpolicy="no-referrer">
                    <div class="status-dot"></div>
                </div>
                <div class="user-info">
                    <p class="user-name">${selfName} <span style="color: #6366f1; font-size: 11px;">(you)</span></p>
                    <p class="user-role">${selfRoleLabel}</p>
                    <p style="margin: 2px 0 0; font-size: 10px; color: #6366f1; display: flex; align-items: center; gap: 3px;">📍 ${selfPageName}</p>
                </div>
            </div>
        `;

        if (users.length === 0) {
            html += `
                <div class="collab-empty-state">
                    <p style="font-size: 12px; opacity: 0.7; margin-top: 8px;">No other collaborators online</p>
                    <p style="font-size: 11px; margin-top: 4px; opacity: 0.5;">Share this project to collaborate in real-time</p>
                </div>
            `;
        }

        // Add other collaborators
        html += users.map(user => {
            const color = this.getUserColor(user.socketId || user.id);
            const avatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.id}`;
            const role = user.role || 'Collaborator';
            const roleLabel = role === 'owner' ? 'Owner 👑' : role.charAt(0).toUpperCase() + role.slice(1);

            // Determine current tab location display
            let locationLabel = '';
            if (user.currentPath) {
                const pathClean = user.currentPath.split('?')[0].split('#');
                const fileName = pathClean[0].split('/').pop() || '';
                const hashPart = pathClean[1] || '';
                const pageName = fileName.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                locationLabel = hashPart
                    ? hashPart.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : pageName || 'Dashboard';
            }

            return `
                <div class="collab-user-item">
                    <div class="avatar" style="border: 2px solid ${color};">
                        <img src="${avatar}" referrerpolicy="no-referrer">
                        <div class="status-dot"></div>
                    </div>
                    <div class="user-info">
                        <p class="user-name">${user.name || 'Anonymous'}</p>
                        <p class="user-role">${roleLabel}</p>
                        ${locationLabel ? `<p style="margin: 2px 0 0; font-size: 10px; color: ${color}; display: flex; align-items: center; gap: 3px;">📍 ${locationLabel}</p>` : ''}
                    </div>
                    <div class="user-cursor-color" style="background: ${color};" title="Cursor color"></div>
                </div>
            `;
        }).join('');

        body.innerHTML = html;
    }

    connect() {
        if (typeof io === 'undefined') {
            console.error('❌ Socket.io client library not loaded');
            return;
        }

        // Try to get token from multiple sources
        let token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');

        // Final fallback: check URL again if storage failed (just in case)
        if (!token) {
            const urlParams = new URLSearchParams(window.location.search);
            token = urlParams.get('token');
            if (token) {
                console.log('🔑 Recovery: Found token in URL during socket connect');
                localStorage.setItem('simvex_token', token);
            }
        }

        if (!token) {
            console.warn('⚠️ No authentication token found - connecting as Guest');
        } else {
            console.log('🔑 Connecting with token:', token.substring(0, 10) + '...');
        }

        console.log('🔌 Connecting to collaboration server...', this.serverUrl);

        // Render initial "Connecting..." state
        this.renderCollaborators();

        this.socket = io(this.serverUrl, {
            auth: { token },
            query: { projectId: this.projectId },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to collaboration server', this.socket.id);
            this.renderCollaborators(); // Update to "Connected" state

            // Send initial location WITH join request to prevent race condition
            this.socket.emit('join-project', {
                projectId: this.projectId,
                path: window.location.pathname
            });

            // Broadcast my location (redundant but safe backup)
            this.socket.emit('user-location', window.location.pathname);
        });

        this.socket.on('user-location-update', (data) => {
            // Look up by userId (our map key is now userId.toString())
            const uid = (data.userId || data.socketId || '').toString();
            const user = this.collaborators.get(uid);
            if (user) {
                const oldPath = user.currentPath;
                user.currentPath = data.path;
                this.renderNavPresence();
                this.renderCollaborators(); // Update location badges on avatars
                if (this.popupOpen) this.renderPopupContent();

                // Show tab-switch notification if the page actually changed
                if (data.path && oldPath !== data.path) {
                    const newPageName = this.getPageNameFromPath(data.path);
                    this.showTabSwitchNotification(user, newPageName);
                }

                // If the user moved to a different page, immediately hide their cursor
                if (data.path) {
                    const remoteFile = data.path.split('?')[0].split('/').pop();
                    const localFile = window.location.pathname.split('?')[0].split('/').pop();
                    if (remoteFile !== localFile) {
                        this.removeCursor(uid);
                    }
                }
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            this.renderCollaborators(); // Show disconnected state
        });

        this.socket.on('disconnect', () => {
            console.log('⚠️ Disconnected from collaboration server');
            this.renderCollaborators();
        });

        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        // Handle initial user list
        this.socket.on('room-users', (users) => {
            console.log('👥 Active users in room:', users);
            this.collaborators.clear();

            // Clean up ALL existing cursors (fresh state from server)
            this.cursors.forEach((cursorEl, key) => {
                cursorEl.remove();
            });
            this.cursors.clear();

            // Deduplicate by userId - same user may have multiple socket connections
            const seenUserIds = new Set();

            users.forEach(user => {
                // Skip self
                if (this.isSelf(user)) return;

                // Deduplicate by userId - keep the latest socketId
                const uid = (user.userId || user.socketId || '').toString();
                if (!uid) return;

                if (seenUserIds.has(uid)) return;
                seenUserIds.add(uid);

                this.collaborators.set(uid, user);
            });

            this.renderCollaborators();
            this.renderNavPresence();
            if (this.popupOpen) this.renderPopupContent();
        });

        // Handle new user joining
        this.socket.on('user-joined', (user) => {
            console.log('👤 User joined:', user.name, user.isReconnection ? '(Reconnection)' : '');

            // Skip self
            if (this.isSelf(user)) return;

            const uid = (user.userId || user.socketId || '').toString();
            if (!uid) return;

            // Remove any existing entry AND cursor for this userId (prevents duplicates on reconnect)
            for (const [key, existingUser] of this.collaborators) {
                const existingUid = (existingUser.userId || existingUser._id || '').toString();
                if (existingUid && existingUid === uid) {
                    this.collaborators.delete(key);
                    this.removeCursor(key);
                }
            }
            // Also remove cursor by the new uid key (in case it was stored under userId)
            this.removeCursor(uid);

            this.collaborators.set(uid, user);
            this.renderCollaborators();
            this.renderNavPresence();
            if (this.popupOpen) this.renderPopupContent();

            // Only show notification if it's NOT a seamless reconnection
            if (!user.isReconnection) {
                this.showJoinNotification(user);
            }
        });

        // Handle user leaving
        this.socket.on('user-left', (data) => {
            const userId = (data.userId || data || '').toString();
            // Find ALL entries matching this userId and remove them
            const keysToRemove = [];
            for (const [key, user] of this.collaborators) {
                const userUid = (user.userId || user._id || '').toString();
                if (key === userId || userUid === userId) {
                    keysToRemove.push(key);
                }
            }

            if (keysToRemove.length > 0) {
                let lastUser = null;
                keysToRemove.forEach(key => {
                    lastUser = this.collaborators.get(key);
                    this.collaborators.delete(key);
                    this.removeCursor(key);
                });
                // Also try to remove cursor by userId directly
                this.removeCursor(userId);

                this.renderCollaborators();
                this.renderNavPresence();
                if (this.popupOpen) this.renderPopupContent();

                // Record leave time to suppress rapid re-joins
                sessionStorage.setItem(`simvex_left_${userId}`, Date.now().toString());

                // Show leave notification
                this.showLeaveNotification(lastUser);
            }
        });

        // Handle cursor updates
        this.socket.on('cursor-update', (data) => {
            // Prevent self-cursor from being displayed (check socket AND user ID)
            if (this.isSelf(data)) return;

            // Always use userId as cursor key (not socketId) to prevent duplicates on tab switch
            const cursorKey = (data.userId || data.socketId || '').toString();

            // Only show cursor if remote user is on the SAME page
            if (data.currentPath) {
                const remoteFile = data.currentPath.split('?')[0].split('/').pop();
                const localFile = window.location.pathname.split('?')[0].split('/').pop();
                if (remoteFile !== localFile) {
                    // Different page - hide cursor if it exists
                    this.removeCursor(cursorKey);
                    return;
                }
            }

            this.updateCursor(cursorKey, data.position?.x || data.x, data.position?.y || data.y, data.name, data.avatar);
        });

        // Setup local cursor tracking
        this.setupLocalCursorTracking();
    }

    showJoinNotification(user) {
        // Check if we should suppress notification (e.g. page reload/navigation)
        const lastLeft = sessionStorage.getItem(`simvex_left_${user.userId}`);
        const now = Date.now();
        if (lastLeft && (now - parseInt(lastLeft)) < 5000) {
            console.log('Suppressing join notification for', user.name);
            return;
        }

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9));
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 8px 30px rgba(34, 197, 94, 0.3);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
            font-size: 14px;
        `;
        const avatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
        notification.innerHTML = `
            <img src="${avatar}" referrerpolicy="no-referrer" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; object-fit: cover;">
            <span><strong>${user.name || 'Someone'}</strong> joined</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }



    setupNavigationTracking() {
        // Legacy stub - replaced by setupNavTracking()
    }

    /**
     * Track nav pill clicks and page navigation to broadcast user location.
     * This allows other collaborators to see which tab you're on.
     */
    setupNavTracking() {
        // 1. Intercept nav pill clicks to broadcast location
        const navLinks = document.querySelectorAll('.nav-pill');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const href = link.getAttribute('href');
                if (!href || href === '#' || href.startsWith('javascript:')) {
                    // For SPA-style nav pills (like Biology's switchPage)
                    // Read the pill text to construct a virtual path
                    const pillText = link.textContent.trim().toLowerCase().replace(/\s+/g, '-');
                    const currentModule = window.location.pathname.split('/').filter(Boolean);
                    const moduleName = currentModule.length > 0 ? currentModule[currentModule.length - 1].replace('.html', '') : '';
                    const virtualPath = `${window.location.pathname}#${pillText}`;
                    this.broadcastLocation(virtualPath);
                    return;
                }
                // For regular href nav pills, the beforeunload will handle it,
                // but we also emit immediately for faster visual feedback
                // Resolve the href relative to current page
                try {
                    const resolved = new URL(href, window.location.href);
                    this.broadcastLocation(resolved.pathname);
                } catch (e) {
                    this.broadcastLocation(href);
                }
            });
        });

        // 2. Track browser back/forward navigation
        window.addEventListener('popstate', () => {
            this.broadcastLocation(window.location.pathname);
        });

        // 3. Store leave timestamp for reconnection suppression
        window.addEventListener('beforeunload', () => {
            if (this.currentUser && this.currentUser._id) {
                sessionStorage.setItem(`simvex_left_${this.currentUser._id}`, Date.now().toString());
            }
        });

        // 4. Observe SPA-style navigation (hash changes, pushState)
        window.addEventListener('hashchange', () => {
            this.broadcastLocation(window.location.pathname + window.location.hash);
        });

        // 5. Monkey-patch pushState / replaceState for SPA-style frameworks
        const self = this;
        const origPushState = history.pushState;
        history.pushState = function () {
            origPushState.apply(this, arguments);
            self.broadcastLocation(window.location.pathname);
        };
        const origReplaceState = history.replaceState;
        history.replaceState = function () {
            origReplaceState.apply(this, arguments);
            // Don't broadcast on replaceState (usually used for URL cleanup)
        };
    }

    /**
     * Broadcast the current user's location (path) to all collaborators.
     * @param {string} path - The page path to broadcast
     */
    broadcastLocation(path) {
        if (!this.socket || !this.socket.connected) return;
        if (!path) path = window.location.pathname;
        console.log('📍 Broadcasting location:', path);
        this.socket.emit('user-location', path);
    }

    showLeaveNotification(user) {
        if (!user) return;
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, rgba(100, 116, 139, 0.9), rgba(71, 85, 105, 0.9));
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
            font-size: 14px;
        `;
        notification.innerHTML = `
            <span class="material-icons-round">person_off</span>
            <span><strong>${user.name || 'Someone'}</strong> left</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    setupLocalCursorTracking() {
        document.addEventListener('mousemove', (e) => {
            if (!this.socket || !this.socket.connected) return;

            // Throttle cursor updates (every 50ms)
            const now = Date.now();
            if (now - this.lastCursorUpdate < 50) return;
            this.lastCursorUpdate = now;

            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            this.socket.emit('cursor-move', { x, y });
        });
    }

    renderCollaborators() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn('Collaboration container not found:', this.containerId);
            return;
        }

        const users = Array.from(this.collaborators.values());
        const isConnected = this.socket && this.socket.connected;

        container.className = 'collab-avatars-container';
        container.onclick = () => this.openPopup();
        container.style.display = 'flex';

        // Always show connection status indicator
        let html = `
            <div class="connection-status" style="
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: ${isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
                border: 1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.2s;
            ">
                <div style="
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${isConnected ? '#22c55e' : '#ef4444'};
                    ${isConnected ? 'animation: pulse 2s infinite;' : ''}
                "></div>
                <span style="font-size: 12px; font-weight: 500; color: ${isConnected ? '#22c55e' : '#ef4444'};">
                    ${isConnected ? (users.length > 0 ? `${users.length + 1} online` : 'Connected') : 'Connecting...'}
                </span>
            </div>
        `;

        // Always show current user's Google profile avatar first
        if (isConnected && this.currentUser) {
            const selfAvatar = this.currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.currentUser.name || 'me'}`;
            html += `
                <div class="collaborator-avatar" title="${this.currentUser.name || 'You'} (you)" 
                     style="border-color: #6366f1; z-index: 11; margin-left: 8px;">
                    <img src="${selfAvatar}" referrerpolicy="no-referrer">
                    <div class="online-indicator"></div>
                </div>
            `;
        }

        // Show other collaborators' avatars with location badges
        if (users.length > 0) {
            html += users.slice(0, 4).map((user, index) => {
                const color = this.getUserColor(user.userId || user.socketId || user.id);
                const avatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.id}`;
                const locationLabel = user.currentPath ? this.getPageNameFromPath(user.currentPath) : '';
                return `
                    <div class="collab-avatar-wrapper" style="margin-left: -6px;">
                        <div class="collaborator-avatar" title="${user.name || 'Anonymous'}${locationLabel ? ' — 📍 ' + locationLabel : ''}" 
                             style="border-color: ${color}; z-index: ${10 - index};">
                            <img src="${avatar}" referrerpolicy="no-referrer">
                            <div class="online-indicator"></div>
                        </div>
                        ${locationLabel ? `<div class="collab-location-badge" style="background: linear-gradient(135deg, ${color}dd, ${color}aa);">${locationLabel}</div>` : ''}
                    </div>
                `;
            }).join('');

            if (users.length > 4) {
                html += `<div class="more-users-badge" style="margin-left: -6px;">+${users.length - 4}</div>`;
            }
        }

        container.innerHTML = html;
    }

    updateCursor(userId, xPercent, yPercent, userName, userAvatar) {
        if (!userId || xPercent === undefined || yPercent === undefined) return;

        let cursor = this.cursors.get(userId);
        const color = this.getUserColor(userId);

        // Create cursor if not exists
        if (!cursor) {
            const user = this.collaborators.get(userId);
            const name = userName || (user ? user.name : 'Anonymous');

            cursor = document.createElement('div');
            cursor.className = 'remote-cursor';
            cursor.innerHTML = `
                <div class="cursor-pointer" style="border-bottom-color: ${color}"></div>
                <div class="cursor-label" style="background: ${color}">${name}</div>
            `;
            document.getElementById(this.cursorLayerId)?.appendChild(cursor);
            this.cursors.set(userId, cursor);
        }

        // Update position
        const x = xPercent * window.innerWidth;
        const y = yPercent * window.innerHeight;
        cursor.style.transform = `translate(${x}px, ${y}px)`;
    }

    removeCursor(userId) {
        const cursor = this.cursors.get(userId);
        if (cursor) {
            cursor.style.transition = 'opacity 0.3s';
            cursor.style.opacity = '0';
            setTimeout(() => {
                cursor.remove();
                this.cursors.delete(userId);
            }, 300);
        }
    }

    getUserColor(id) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#F7DC6F', '#8b5cf6', '#ec4899', '#06b6d4',
            '#10b981', '#f59e0b'
        ];
        let hash = 0;
        const str = String(id);
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    // Public method to manually set current user
    setCurrentUser(user) {
        this.currentUser = user;
    }

    /**
     * Convert a URL path to a user-friendly page name.
     * e.g. "/chemistry/simulation.html?id=xxx" -> "Simulation"
     *      "/biology/index.html#cell-structure" -> "Cell Structure"
     */
    getPageNameFromPath(path) {
        if (!path) return '';
        const parts = path.split('?')[0].split('#');
        const fileName = parts[0].split('/').pop() || '';
        const hashPart = parts[1] || '';

        let pageName = '';
        if (hashPart) {
            pageName = hashPart.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        } else if (fileName) {
            pageName = fileName
                .replace('.html', '')
                .replace(/index$/i, 'Home')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
        }

        // Also try to extract module name for cross-module visibility
        const pathParts = path.split('?')[0].replace(/^\/+/, '').split('/');
        if (pathParts.length > 1) {
            const moduleName = pathParts[pathParts.length - 2]
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
            // If we're in a different module than the current page, prefix module name
            const currentModule = window.location.pathname.replace(/^\/+/, '').split('/')[0] || '';
            const remoteModule = pathParts[pathParts.length - 2] || '';
            if (remoteModule && currentModule && remoteModule.toLowerCase() !== currentModule.toLowerCase()) {
                return `${moduleName} · ${pageName}`;
            }
        }

        return pageName || 'Dashboard';
    }

    /**
     * Show a brief notification when a collaborator switches tabs.
     */
    showTabSwitchNotification(user, pageName) {
        if (!user || !pageName) return;

        // Remove any existing tab-switch toast
        document.querySelectorAll('.collab-tab-switch-toast').forEach(el => {
            el.style.animation = 'tabSwitchSlideOut 0.3s ease forwards';
            setTimeout(() => el.remove(), 300);
        });

        const avatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'anon'}`;
        const color = this.getUserColor(user.userId || user.socketId || user.id);

        const toast = document.createElement('div');
        toast.className = 'collab-tab-switch-toast';
        toast.innerHTML = `
            <img src="${avatar}" referrerpolicy="no-referrer">
            <span><strong>${user.name || 'Someone'}</strong></span>
            <span class="tab-icon">→</span>
            <span class="tab-page" style="color: ${color};">${pageName}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'tabSwitchSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.collaborators.clear();
        this.cursors.forEach(cursor => cursor.remove());
        this.cursors.clear();
    }

    // ===============================
    // Real-time Notes Collaboration
    // ===============================

    /**
     * Emit note content update to other collaborators
     * @param {string} noteId - The note ID being edited
     * @param {string} content - The note content (HTML or plain text)
     * @param {string} title - The note title
     */
    emitNoteUpdate(noteId, content, title = '') {
        if (!this.socket?.connected) {
            console.log('⚠️ Socket not connected for note update');
            return;
        }

        console.log('📤 Sending note-update via socket:', { noteId, contentLength: content?.length || 0 });

        this.socket.emit('note-update', {
            noteId,
            content,
            title
        });
    }

    /**
     * Emit note cursor position for collaborative editing
     * @param {string} noteId - The note ID
     * @param {number} position - Cursor position
     * @param {Object} selection - Selection range {start, end}
     */
    emitNoteCursor(noteId, position, selection = null) {
        if (!this.socket?.connected) return;

        this.socket.emit('note-cursor', {
            noteId,
            position,
            selection
        });
    }

    /**
     * Listen for note updates from other collaborators
     * @param {Function} callback - Function to call when note is updated
     */
    onNoteUpdate(callback) {
        if (!this.socket) return;

        this.socket.on('note-update', (data) => {
            console.log('📝 Note update from:', data.userName);
            callback(data);
        });
    }

    /**
     * Listen for note cursor updates
     * @param {Function} callback - Function to call with cursor data
     */
    onNoteCursor(callback) {
        if (!this.socket) return;

        this.socket.on('note-cursor', (data) => {
            callback(data);
        });
    }

    // ===============================
    // Real-time Drawing Collaboration
    // ===============================

    /**
     * Emit a drawing stroke to other collaborators
     * @param {Array} points - Array of {x, y} points
     * @param {string} color - Stroke color
     * @param {number} size - Brush size
     * @param {number} opacity - Stroke opacity
     * @param {string} tool - Tool type ('pen', 'eraser', 'highlighter')
     */
    emitDrawingStroke(points, color, size, opacity = 1, tool = 'pen') {
        if (!this.socket?.connected) return;

        this.socket.emit('drawing-stroke', {
            points,
            color,
            size,
            opacity,
            tool
        });
    }

    /**
     * Emit canvas clear event
     */
    emitDrawingClear() {
        if (!this.socket?.connected) return;
        this.socket.emit('drawing-clear');
    }

    /**
     * Listen for drawing strokes from other collaborators
     * @param {Function} callback - Function to render the stroke
     */
    onDrawingStroke(callback) {
        if (!this.socket) return;

        this.socket.on('drawing-stroke', (data) => {
            console.log('🎨 Drawing stroke from:', data.userName);
            callback(data);
        });
    }

    /**
     * Listen for canvas clear events
     * @param {Function} callback - Function to clear the canvas
     */
    onDrawingClear(callback) {
        if (!this.socket) return;

        this.socket.on('drawing-clear', (data) => {
            console.log('🧹 Canvas cleared by:', data.userName);
            callback(data);
        });
    }

    // ===============================
    // Real-time Sticky Notes
    // ===============================

    /**
     * Emit sticky note action (create, update, delete, move)
     * @param {string} action - 'create', 'update', 'delete', 'move'
     * @param {Object} noteData - Sticky note data
     */
    emitStickyNoteUpdate(action, noteData) {
        if (!this.socket?.connected) return;

        this.socket.emit('sticky-note-update', {
            action,
            noteData
        });
    }

    /**
     * Listen for sticky note updates
     * @param {Function} callback - Function to handle sticky note changes
     */
    onStickyNoteUpdate(callback) {
        if (!this.socket) return;

        this.socket.on('sticky-note-update', (data) => {
            console.log('📌 Sticky note', data.action, 'by:', data.userName);
            callback(data);
        });
    }

    /**
     * Show a collaboration notification for content sync
     * @param {string} type - Type of content ('note', 'drawing', 'sticky')
     * @param {string} userName - Name of the user who made the change
     */
    showSyncNotification(type, userName) {
        const icons = { note: '📝', drawing: '🎨', sticky: '📌' };
        const labels = { note: 'note', drawing: 'drawing', sticky: 'sticky note' };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 20px;
            background: rgba(30, 41, 59, 0.95);
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            animation: slideInLeft 0.3s ease;
            font-size: 13px;
            border-left: 3px solid #06b6d4;
        `;
        notification.innerHTML = `
            <span style="font-size: 18px;">${icons[type] || '📋'}</span>
            <span><strong>${userName}</strong> updated the ${labels[type] || 'content'}</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    /**
     * Check if a user object represents the current user
     * @param {Object} user - User object from socket
     * @returns {boolean} - True if it is the current user
     */
    isSelf(user) {
        // 1. Check socket ID (always valid if connected)
        if (this.socket && user.socketId === this.socket.id) return true;

        // 2. Check User ID if authenticated
        // Handle various ID formats (string, object, etc.)
        if (this.currentUser && this.currentUser._id) {
            const selfId = this.currentUser._id.toString();
            // User from socket might have userId or id or _id
            const otherId = (user.userId || user.id || user._id || '').toString();

            if (otherId && selfId === otherId) return true;
        }

        return false;
    }
}

// Add animation keyframes
const animStyles = document.createElement('style');
animStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(animStyles);

// Export for module usage or global
window.WorkspaceCollaboration = WorkspaceCollaboration;
