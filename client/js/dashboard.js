/**
 * SIMVEX Dashboard Controller
 */

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.selectedCategory = null;
        this.reportChart = null;

        this.init();
    }

    async init() {
        const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        if (!api.token) {
            api.setToken(token, !!localStorage.getItem('simvex_token'));
        }

        try {
            const response = await api.getMe();
            this.currentUser = response.data.user;
            this.updateUserUI();
        } catch (error) {
            console.error('Auth failed', error);
            localStorage.removeItem('simvex_token');
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Notification
        document.getElementById('notificationBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('notificationDropdown').classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-wrapper')) {
                document.getElementById('notificationDropdown')?.classList.remove('active');
            }
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.closest('.nav-link');
                this.handleNavigation(target);
            });
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            api.clearToken();
            window.location.href = 'index.html';
        });

        // Category Select
        document.getElementById('dashboardCategorySelect')?.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.loadDashboardData();
        });

        // Report Timeframe
        document.getElementById('reportTimeframe')?.addEventListener('change', () => {
            this.loadReportChart();
        });

        // Search
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const term = e.target.value.toLowerCase();
                this.filterLists(term);
            }
        });

        // Library Tabs
        document.getElementById('tabPdf')?.addEventListener('click', () => this.switchLibraryTab('pdf'));
        document.getElementById('tabNotes')?.addEventListener('click', () => this.switchLibraryTab('notes'));

        // Profile Modal (Optimized to Page View, logic handled in handleNavigation)
        // this.setupProfileModal(); // Removed

        // Project Modals (Reuse existing logic or simplified)
        document.getElementById('newProjectBtn')?.addEventListener('click', () => {
            document.getElementById('newProjectModal').classList.add('active');
            // Reset modal state
            document.querySelectorAll('.category-option').forEach(o => o.classList.remove('selected'));
            document.getElementById('projectCategory').value = '';
            document.getElementById('newProjectForm').reset();
        });
        document.getElementById('cancelProjectBtn')?.addEventListener('click', () => document.getElementById('newProjectModal').classList.remove('active'));
        document.getElementById('newProjectForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewProject();
        });

        // Category selection in modal
        document.querySelectorAll('.category-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.category-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                const category = opt.dataset.category;
                const hiddenInput = document.getElementById('projectCategory');
                if (hiddenInput) hiddenInput.value = category;
            });
        });

        // Global click handler for project cards and menus
        document.addEventListener('click', (e) => {
            const menuBtn = e.target.closest('.project-menu-btn');
            const menuItem = e.target.closest('.menu-item');
            const projectCard = e.target.closest('.project-card');

            // Handle Menu Button Toggle
            if (menuBtn) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = menuBtn.nextElementSibling;
                const isActive = dropdown.classList.contains('active');
                document.querySelectorAll('.project-menu-dropdown').forEach(m => m.classList.remove('active'));
                if (!isActive) dropdown.classList.add('active');
                return;
            }

            // Close menus when clicking outside
            if (!e.target.closest('.project-card-actions')) {
                document.querySelectorAll('.project-menu-dropdown').forEach(m => m.classList.remove('active'));
            }

            // Handle Menu Actions
            if (menuItem) {
                e.stopPropagation();
                const id = menuItem.dataset.id;

                if (menuItem.classList.contains('rename-opt')) {
                    const name = menuItem.dataset.name;
                    document.getElementById('renameProjectId').value = id;
                    document.getElementById('renameProjectInput').value = name;
                    document.getElementById('renameProjectModal').classList.add('active');
                } else if (menuItem.classList.contains('delete-opt')) {
                    document.getElementById('deleteProjectId').value = id;
                    document.getElementById('deleteProjectModal').classList.add('active');
                } else if (menuItem.classList.contains('share-opt')) {
                    this.handleShareProject(id);
                }
                document.querySelectorAll('.project-menu-dropdown').forEach(m => m.classList.remove('active'));
                return;
            }

            // Handle Project Card Navigation (only if not clicking menu parts)
            if (projectCard && !e.target.closest('.project-card-actions')) {
                const url = projectCard.dataset.url;
                if (url) window.location.href = url;
            }
        });

        // Rename modal actions
        document.getElementById('cancelRenameBtn')?.addEventListener('click', () => {
            document.getElementById('renameProjectModal').classList.remove('active');
        });
        document.getElementById('renameProjectForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRenameProject();
        });

        // Delete modal actions
        document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
            document.getElementById('deleteProjectModal').classList.remove('active');
        });
        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
            const id = document.getElementById('deleteProjectId').value;
            this.handleDeleteProject(id);
        });

        // Share modal actions
        document.getElementById('closeShareBtn')?.addEventListener('click', () => {
            document.getElementById('shareProjectModal').classList.remove('active');
        });

        // Share Role selection
        document.querySelectorAll('.role-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.role-opt').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                const id = document.getElementById('shareLinkInput').dataset.projectId;
                if (id) {
                    this.handleShareProject(id, btn.dataset.role);
                }
            });
        });

        document.getElementById('copyShareLinkBtn')?.addEventListener('click', () => {
            const input = document.getElementById('shareLinkInput');
            input.select();
            document.execCommand('copy');
            const originalText = document.getElementById('copyShareLinkBtn').textContent;
            document.getElementById('copyShareLinkBtn').textContent = 'Copied!';
            setTimeout(() => {
                document.getElementById('copyShareLinkBtn').textContent = originalText;
            }, 2000);
        });

        // Note Rename Modal
        document.getElementById('renameNoteForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processRenameNote();
        });
        document.getElementById('cancelRenameNoteBtn')?.addEventListener('click', () => {
            document.getElementById('renameNoteModal').classList.remove('active');
        });

        // Note Delete Modal
        document.getElementById('cancelDeleteNoteBtn')?.addEventListener('click', () => {
            document.getElementById('deleteNoteConfirmModal').classList.remove('active');
        });
        document.getElementById('confirmDeleteNoteBtn')?.addEventListener('click', () => {
            this.processDeleteNote();
        });
    }

    loadProfileView() {
        if (!this.currentUser) return;

        const nameInput = document.getElementById('profilePageName');
        const emailInput = document.getElementById('profilePageEmail');
        const avatarPreview = document.getElementById('profilePageAvatarPreview');
        const avatarInput = document.getElementById('profilePageAvatarInput');
        const pwInput = document.getElementById('profilePagePassword');

        if (nameInput) nameInput.value = this.currentUser.name;
        const displayUsername = document.getElementById('profileDisplayUsername');
        if (displayUsername) displayUsername.textContent = this.currentUser.name;

        if (emailInput) emailInput.value = this.currentUser.email;

        const avatar = this.currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.currentUser.name}`;
        if (avatarPreview) avatarPreview.src = avatar;
        if (avatarInput) avatarInput.value = avatar;
        if (pwInput) pwInput.value = ''; // Clear password field

        // Attach listeners (ensure single attachment or handle re-render efficiently)
        // Ideally checking if listener attached, but simple replacement is fine for now
        const form = document.getElementById('profilePageForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.updateProfilePage();
        };

        document.getElementById('pageLogoutBtn').onclick = () => {
            if (confirm('Are you sure you want to logout?')) {
                api.clearToken();
                window.location.href = 'index.html';
            }
        };
    }

    // Removed old setupProfileModal / openProfileModal methods

    async updateProfilePage() {
        const name = document.getElementById('profilePageName').value;
        const password = document.getElementById('profilePagePassword').value;

        try {
            const updateData = { name };
            if (password) updateData.newPassword = password;

            const res = await api.updateProfile(updateData);

            if (res.success) {
                alert('Profile updated successfully.');
                this.currentUser = res.data.user;
                this.updateUserUI(); // Update sidebar avatar/name
                // Stay on page
            }
        } catch (err) {
            alert('Update failed: ' + err.message);
        }
    }

    updateUserUI() {
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('headerAvatar');

        if (nameEl) nameEl.textContent = this.currentUser.name;
        if (avatarEl && this.currentUser.avatar) {
            // Add a timestamp to force browser to re-fetch if it's the same URL but content might have changed (though seed URLs shouldn't)
            avatarEl.src = this.currentUser.avatar;
        } else if (avatarEl) {
            avatarEl.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.currentUser.name}`;
        }
    }

    mapCategory(category) {
        const mapping = {
            'mechanical': 'engineering',
            'medical': 'math',
            'medicine': 'math',
            'math': 'math',
            'earth': 'earthscience',
            'earthscience': 'earthscience'
        };
        return mapping[category] || category;
    }

    handleNavigation(linkElement) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        linkElement.classList.add('active');

        const page = linkElement.dataset.page;
        const category = linkElement.dataset.category;

        // Ensure views exist before hiding
        const views = ['dashboardView', 'projectsView', 'libraryView', 'collaborationView', 'profileView', 'workflowView'];
        views.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        if (category) {
            this.selectedCategory = category;
            const select = document.getElementById('dashboardCategorySelect');
            if (select) select.value = category;

            const dashView = document.getElementById('dashboardView');
            if (dashView) dashView.style.display = 'block';

            this.loadDashboardData();
            return;
        }

        if (page === 'dashboard') {
            this.selectedCategory = null;
            const select = document.getElementById('dashboardCategorySelect');
            if (select) select.value = "";

            const dashView = document.getElementById('dashboardView');
            if (dashView) dashView.style.display = 'block';

            this.loadDashboardData();

        } else if (page === 'projects') {
            this.ensureView('projectsView', `
                <div class="page-header">
                    <h1 class="page-title">My Projects</h1>
                </div>
                <div id="allProjectsList" class="projects-grid"></div>
            `);
            document.getElementById('projectsView').style.display = 'block';
            this.loadAllProjects('allProjectsList');

        } else if (page === 'library') {
            this.ensureView('libraryView', `
                 <div class="page-header">
                    <h1 class="page-title">Library</h1>
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-primary" id="tabPdf">PDF Archive</button>
                        <button class="btn btn-sm btn-ghost" id="tabNotes">Notes</button>
                    </div>
                </div>
                <div id="libraryContentPdf" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div id="pdfList" class="grid grid-cols-1 gap-4 w-full"></div>
                </div>
                <div id="libraryContentNotes" class="grid grid-cols-1 md:grid-cols-2 gap-4" style="display:none;">
                    <div id="notesList" class="grid grid-cols-1 gap-4 w-full"></div>
                </div>
            `);
            // Re-attach listeners for new elements
            document.getElementById('tabPdf').onclick = () => this.switchLibraryTab('pdf');
            document.getElementById('tabNotes').onclick = () => this.switchLibraryTab('notes');

            document.getElementById('libraryView').style.display = 'block';
            this.loadLibraryData();

        } else if (page === 'collaboration') {
            this.ensureView('collaborationView', `
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Collaboration Hub</h1>
                        <p class="page-subtitle">Manage your collaborators and shared projects</p>
                    </div>
                </div>
                
                <!-- Collaboration Tabs -->
                <div class="collab-tabs" style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
                    <button class="collab-tab active" data-tab="collaborators">
                        <span class="material-icons-round">people</span>
                        My Collaborators
                        <span class="tab-badge" id="collabCountBadge" style="display: none;">0</span>
                    </button>
                    <button class="collab-tab" data-tab="requests">
                        <span class="material-icons-round">person_add</span>
                        Requests
                        <span class="tab-badge" id="requestCountBadge" style="display: none;">0</span>
                    </button>
                    <button class="collab-tab" data-tab="invitations">
                        <span class="material-icons-round">mail</span>
                        Project Invitations
                        <span class="tab-badge" id="invitationCountBadge" style="display: none;">0</span>
                    </button>
                    <button class="collab-tab" data-tab="shared">
                        <span class="material-icons-round">folder_shared</span>
                        Shared Projects
                    </button>
                </div>
                
                <!-- Tab Content: My Collaborators -->
                <div id="collabTabCollaborators" class="collab-tab-content">
                    <div class="add-collaborator-section" style="margin-bottom: 24px;">
                        <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--text-secondary);">Add New Collaborator</h3>
                        <div style="display: flex; gap: 12px; max-width: 500px;">
                            <div style="flex: 1; position: relative;">
                                <input type="email" class="input" id="addCollabEmail" placeholder="Enter email address...">
                                <div id="collabSearchResults" class="search-dropdown" style="display: none;"></div>
                            </div>
                            <button class="btn btn-primary" id="sendCollabRequestBtn">
                                <span class="material-icons-round" style="font-size: 18px;">person_add</span>
                                Add
                            </button>
                        </div>
                    </div>
                    <div id="collaboratorsList" class="collaborators-grid"></div>
                </div>
                
                <!-- Tab Content: Requests -->
                <div id="collabTabRequests" class="collab-tab-content" style="display: none;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div>
                            <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--text-secondary);">
                                <span class="material-icons-round" style="vertical-align: middle; margin-right: 4px;">inbox</span>
                                Received Requests
                            </h3>
                            <div id="pendingRequestsList"></div>
                        </div>
                        <div>
                            <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--text-secondary);">
                                <span class="material-icons-round" style="vertical-align: middle; margin-right: 4px;">send</span>
                                Sent Requests
                            </h3>
                            <div id="sentRequestsList"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Tab Content: Project Invitations -->
                <div id="collabTabInvitations" class="collab-tab-content" style="display: none;">
                    <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--text-secondary);">
                        Pending Project Invitations
                        <span class="badge" id="collabInviteCount" style="margin-left: 8px;">0</span>
                    </h3>
                    <div id="invitationList" class="space-y-4"></div>
                </div>
                
                <!-- Tab Content: Shared Projects -->
                <div id="collabTabShared" class="collab-tab-content" style="display: none;">
                    <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--text-secondary);">
                        Projects Shared With You
                    </h3>
                    <div id="sharedProjectList" class="projects-grid"></div>
                </div>
                
                <style>
                    .collab-tabs { flex-wrap: wrap; }
                    .collab-tab {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px 18px;
                        background: rgba(255,255,255,0.03);
                        border: 1px solid var(--border-color);
                        border-radius: 10px;
                        color: var(--text-secondary);
                        cursor: pointer;
                        font-size: 0.9rem;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    }
                    .collab-tab:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
                    .collab-tab.active { 
                        background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
                        color: white;
                        border-color: transparent;
                        box-shadow: 0 4px 15px rgba(99,102,241,0.3);
                    }
                    .collab-tab .material-icons-round { font-size: 20px; }
                    .tab-badge {
                        background: rgba(239,68,68,0.9);
                        color: white;
                        font-size: 11px;
                        padding: 2px 7px;
                        border-radius: 10px;
                        font-weight: 600;
                    }
                    .collab-tab.active .tab-badge { background: rgba(255,255,255,0.25); }
                    .collaborators-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 16px;
                    }
                    .collaborator-card {
                        background: rgba(255,255,255,0.03);
                        border: 1px solid var(--border-color);
                        border-radius: 16px;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        transition: all 0.2s ease;
                    }
                    .collaborator-card:hover {
                        border-color: rgba(99,102,241,0.5);
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    }
                    .collaborator-header {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .collaborator-avatar {
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        object-fit: cover;
                        border: 2px solid rgba(99,102,241,0.3);
                    }
                    .collaborator-info h4 {
                        margin: 0;
                        font-size: 1rem;
                        font-weight: 600;
                        color: var(--text-primary);
                    }
                    .collaborator-info p {
                        margin: 2px 0 0;
                        font-size: 0.8rem;
                        color: var(--text-muted);
                    }
                    .collaborator-actions {
                        display: flex;
                        gap: 8px;
                        margin-top: auto;
                    }
                    .request-card {
                        background: rgba(255,255,255,0.03);
                        border: 1px solid var(--border-color);
                        border-radius: 12px;
                        padding: 16px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 12px;
                    }
                    .search-dropdown {
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: var(--bg-secondary);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        margin-top: 4px;
                        max-height: 200px;
                        overflow-y: auto;
                        z-index: 100;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                    }
                    .search-result-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 10px 12px;
                        cursor: pointer;
                        transition: background 0.15s;
                    }
                    .search-result-item:hover { background: rgba(255,255,255,0.05); }
                    .search-result-item img {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                    }
                </style>
            `);

            // Attach tab click handlers
            document.querySelectorAll('.collab-tab').forEach(tab => {
                tab.onclick = () => this.switchCollabTab(tab.dataset.tab);
            });

            // Attach add collaborator handler
            document.getElementById('sendCollabRequestBtn').onclick = () => this.sendCollaboratorRequest();

            // Attach email input search handler
            const emailInput = document.getElementById('addCollabEmail');
            let searchTimeout;
            emailInput.oninput = () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => this.searchCollaborators(emailInput.value), 300);
            };
            emailInput.onblur = () => {
                setTimeout(() => {
                    document.getElementById('collabSearchResults').style.display = 'none';
                }, 200);
            };

            document.getElementById('collaborationView').style.display = 'block';
            this.loadCollaborationData();

        } else if (page === 'workflow') {
            this.ensureView('workflowView', `
                <style>
                    /* Workflow Placeholder Animations & Styles */
                    #workflowView {
                        position: relative;
                        overflow: hidden;
                    }
                    .workflow-hero {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 65vh;
                        text-align: center;
                        background: radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);
                        border-radius: var(--radius-xl);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        position: relative;
                        overflow: hidden;
                    }
                    /* Subtle grid background */
                    .workflow-hero::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background-image: 
                            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                        background-size: 40px 40px;
                        opacity: 0.5;
                        z-index: 0;
                        mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
                    }
                    
                    /* Animated nodes effect */
                    .node-visual {
                        position: absolute;
                        width: 8px;
                        height: 8px;
                        background: var(--primary);
                        border-radius: 50%;
                        box-shadow: 0 0 10px var(--primary);
                        animation: floatNode 6s infinite ease-in-out;
                        opacity: 0.6;
                    }
                    .node-visual:nth-child(1) { top: 20%; left: 20%; animation-delay: 0s; }
                    .node-visual:nth-child(2) { top: 70%; left: 80%; animation-delay: 2s; background: var(--accent); box-shadow: 0 0 10px var(--accent); }
                    .node-visual:nth-child(3) { top: 40%; left: 85%; animation-delay: 4s; background: var(--success); box-shadow: 0 0 10px var(--success); }
                    .node-visual:nth-child(4) { top: 80%; left: 15%; animation-delay: 1s; }
                    
                    @keyframes floatNode {
                        0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                        50% { transform: translate(10px, -15px); opacity: 0.8; }
                    }

                    .glass-card {
                        background: rgba(30, 41, 59, 0.6);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        padding: 48px;
                        border-radius: 24px;
                        max-width: 600px;
                        position: relative;
                        z-index: 10;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
                        transform: translateY(0);
                        transition: transform 0.3s ease;
                    }
                    .glass-card:hover {
                        transform: translateY(-5px);
                        border-color: rgba(255, 255, 255, 0.2);
                        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
                    }

                    .icon-container {
                        width: 90px;
                        height: 90px;
                        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.1));
                        border-radius: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 24px;
                        border: 1px solid rgba(99, 102, 241, 0.3);
                        box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
                        position: relative;
                    }
                    .icon-container::after {
                        content: '';
                        position: absolute;
                        inset: -2px;
                        border-radius: 22px;
                        background: linear-gradient(45deg, var(--primary), transparent, var(--accent));
                        opacity: 0.3;
                        z-index: -1;
                        filter: blur(8px);
                    }

                    .hero-title {
                        font-size: 2.5rem;
                        font-weight: 700;
                        margin-bottom: 16px;
                        background: linear-gradient(to right, #fff, #a5b4fc);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        letter-spacing: -0.02em;
                    }

                    .hero-desc {
                        font-size: 1.1rem;
                        line-height: 1.6;
                        color: var(--text-secondary);
                        margin-bottom: 32px;
                    }

                    .glow-btn {
                        position: relative;
                        overflow: hidden;
                        background: var(--primary);
                        border: none;
                        padding: 14px 28px;
                        font-size: 1rem;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
                        transition: all 0.3s ease;
                    }
                    .glow-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
                    }
                    .glow-btn::after {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: linear-gradient(rgba(255,255,255,0.2), transparent);
                        transform: rotate(45deg);
                        transition: all 0.5s;
                        opacity: 0;
                    }
                    .glow-btn:hover::after {
                        opacity: 1;
                        transform: rotate(45deg) translate(50%, 50%);
                    }
                </style>

                <div class="page-header">
                    <div>
                        <h1 class="page-title">Workflow</h1>
                        <p class="page-subtitle">Visual Simulation Pipeline Builder</p>
                    </div>
                </div>
                
                <div class="workflow-hero">
                    <div class="node-visual"></div>
                    <div class="node-visual"></div>
                    <div class="node-visual"></div>
                    <div class="node-visual"></div>

                    <div class="glass-card">
                        <div class="icon-container">
                            <span class="material-icons-round" style="font-size: 48px; color: var(--primary-light);">schema</span>
                        </div>
                        <h2 class="hero-title">Automate Your Science</h2>
                        <p class="hero-desc">
                            Design powerful simulation pipelines with our upcoming visual node editor. 
                            Connect data sources, simulation models, and analysis tools in a seamless workflow.
                        </p>
                        <button class="btn btn-primary glow-btn" onclick="window.location.href = 'workflow/index.html'">
                            <span class="material-icons-round">add</span>
                            Create New Workflow
                        </button>
                    </div>
                </div>
            `);
            document.getElementById('workflowView').style.display = 'block';

        } else if (page === 'profile') {
            const dangerStyle = `
                .btn-danger {
                    background: rgba(220, 38, 38, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(220, 38, 38, 0.2);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-danger:hover {
                    background: rgba(220, 38, 38, 0.2);
                    border-color: #ef4444;
                }
                .profile-section {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 24px;
                }
                .profile-label {
                    display: block;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
            `;

            this.ensureView('profileView', `
                <style>${dangerStyle}</style>
                <div class="page-header">
                    <h1 class="page-title">Settings</h1>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8" style="max-width: 1200px; margin: 0 auto;">
                    <!-- Left Column: Navigation/Summary -->
                    <div class="lg:col-span-1">
                        <div class="profile-section text-center">
                            <div style="position: relative; display: inline-block; margin-bottom: 16px;">
                                <img src="" alt="Avatar" class="avatar" id="profilePageAvatarPreview"
                                    style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid rgba(255,255,255,0.05); pointer-events: none;">
                            </div>
                            <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 4px;" id="profileDisplayUsername">Loading...</h2>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">Simvex User</p>
                        </div>
                    </div>

                    <!-- Right Column: Settings Form -->
                    <div class="lg:col-span-2">
                        <form id="profilePageForm">
                            <input type="hidden" id="profilePageAvatarInput">
                            
                            <!-- Profile Information -->
                            <div class="profile-section mb-6">
                                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                                    <span class="material-icons-round" style="color: var(--primary-light);">person</span> Basic Info
                                </h3>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label class="profile-label">Name</label>
                                        <input type="text" class="input w-full" id="profilePageName" required>
                                    </div>
                                    <div>
                                        <label class="profile-label">Email</label>
                                        <input type="email" class="input w-full" id="profilePageEmail" readonly disabled style="opacity: 0.6; cursor: not-allowed;">
                                    </div>
                                </div>

                                <div class="mb-6">
                                    <label class="profile-label">New Password</label>
                                    <input type="password" class="input w-full" id="profilePagePassword" placeholder="Enter only to change">
                                </div>

                                <div class="text-right">
                                    <button type="submit" class="btn btn-primary" style="min-width: 120px;">
                                        <span class="material-icons-round" style="font-size: 18px;">save</span> Save
                                    </button>
                                </div>
                            </div>

                            <!-- Account Actions -->
                            <div class="profile-section" style="border-color: rgba(220, 38, 38, 0.2);">
                                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #ef4444; display: flex; align-items: center; gap: 8px;">
                                    <span class="material-icons-round">warning</span> Account Actions
                                </h3>
                                <div class="flex justify-between items-center">
                                    <div>
                                        <p style="font-size: 0.9rem; margin-bottom: 4px;">Logout</p>
                                        <p style="font-size: 0.8rem; color: var(--text-muted);">Safely log out from this device.</p>
                                    </div>
                                    <button type="button" class="btn btn-danger" id="pageLogoutBtn">
                                        <span class="material-icons-round" style="font-size: 18px;">logout</span> Logout
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            `);

            document.getElementById('profileView').style.display = 'block';
            this.loadProfileView();
        }
    }

    ensureView(viewId, innerHTML) {
        let view = document.getElementById(viewId);
        if (!view) {
            view = document.createElement('div');
            view.id = viewId;
            view.className = 'view-section';
            view.style.display = 'none';
            view.innerHTML = innerHTML;
            document.getElementById('mainContent').appendChild(view);
        }
        return view;
    }

    async loadDashboardData() {
        try {
            // 1. Always fetch unfiltered stats for the Sidebar Badge (Global Count)
            const globalStats = await api.request('GET', '/dashboard/stats');
            if (globalStats.success) {
                if (document.getElementById('projectCount')) {
                    document.getElementById('projectCount').textContent = globalStats.data.projects;
                }
            }

            // 2. Fetch Filtered Stats for Dashboard Cards (Contextual)
            const query = this.selectedCategory ? `?category=${this.selectedCategory}` : '';
            const stats = await api.request('GET', `/dashboard/stats${query}`);

            if (stats.success) {
                // Update Dashboard Cards with filtered data
                if (document.getElementById('statTotalProjects')) document.getElementById('statTotalProjects').textContent = stats.data.projects;
                // Note: 'projectCount' is now handled by globalStats above
                if (document.getElementById('statCollaborators')) document.getElementById('statCollaborators').textContent = stats.data.collaborators;
                if (document.getElementById('statStorage')) document.getElementById('statStorage').textContent = stats.data.storage;
                if (document.getElementById('statWorkTime')) document.getElementById('statWorkTime').textContent = stats.data.workTime;
            }

            const activity = await api.request('GET', `/dashboard/activity${query}`);
            if (activity.success) {
                this.renderActivity(activity.data.activities);
            }

            this.loadReportChart();

        } catch (error) {
            console.error('Data load error', error);
        }
    }

    renderActivity(activities) {
        const container = document.getElementById('activityList');
        if (!container) return;

        if (!activities.length) {
            container.innerHTML = '<p class="text-muted">No recent activity.</p>';
            return;
        }

        container.innerHTML = activities.map(act => `
            <div class="activity-item">
                <div class="activity-icon bg-primary-soft">
                    <span class="material-icons-round">${act.type.includes('project') ? 'folder' : 'edit_note'}</span>
                </div>
                <div class="activity-content">
                    <p class="activity-text"><strong>${act.user.name}</strong> has <strong>${act.title}</strong> ${act.message}</p>
                    <span class="activity-time">${new Date(act.time).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    async loadReportChart() {
        const ctx = document.getElementById('reportChart');
        if (!ctx) return;

        const timeframe = document.getElementById('reportTimeframe')?.value || 'week';
        const category = this.selectedCategory || '';

        try {
            const res = await api.request('GET', `/dashboard/report?timeframe=${timeframe}&category=${category}`);
            if (res.success && window.Chart) {
                if (this.reportChart) this.reportChart.destroy();

                this.reportChart = new Chart(ctx.getContext('2d'), {
                    type: 'line',
                    data: res.data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, grid: { borderDash: [2, 4] } }, x: { grid: { display: false } } }
                    }
                });
            }
        } catch (e) {
            console.error('Chart error', e);
        }
    }

    async loadAllProjects(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loader"></div>';
        try {
            // Use correct API: api.getProjects()
            const res = await api.getProjects();
            if (res.success) {
                this.renderProjectList(container, res.data.projects);
            } else {
                container.innerHTML = 'Failed to load projects';
            }
        } catch (e) {
            console.error(e);
            container.innerHTML = 'Failed to load projects';
        }
    }

    renderProjectList(container, projects) {
        if (!projects.length) {
            container.innerHTML = '<p class="no-data">No projects found.</p>';
            return;
        }

        container.innerHTML = projects.map(p => {
            const mappedCategory = this.mapCategory(p.category);
            console.log(`Debug Project: ${p.name}, Category: ${p.category}, Mapped: ${mappedCategory}`);
            const defaultImg = `assets/categories/${mappedCategory}.png`;
            const thumbnail = p.thumbnail || defaultImg;

            // Force chemistry to study.html, check for other mappings
            let page = 'index.html';
            if (mappedCategory === 'chemistry') page = 'study.html';
            if (mappedCategory === 'earthscience') page = 'constellation.html'; // Example based on other modules

            // Explicitly construct URL to avoid unwanted redirects and pass token
            const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
            const projectUrl = `${mappedCategory}/${page}?id=${p._id}${token ? '&token=' + token : ''}`;

            return `
                <div class="project-card" data-url="${projectUrl}">
                    <div class="project-thumbnail">
                         <img src="${thumbnail}" alt="${p.name}">
                         <div class="project-category">${mappedCategory}</div>
                         
                         <div class="project-card-actions">
                            <button type="button" class="project-menu-btn">
                                <span class="material-icons-round">more_vert</span>
                            </button>
                            <div class="project-menu-dropdown">
                                <div class="menu-item danger delete-opt" data-id="${p._id}">
                                    <span class="material-icons-round">delete</span> Delete
                                </div>
                                <div class="menu-item rename-opt" data-id="${p._id}" data-name="${p.name}">
                                    <span class="material-icons-round">edit</span> Rename
                                </div>
                                <div class="menu-item share-opt" data-id="${p._id}">
                                    <span class="material-icons-round">share</span> Share
                                </div>
                            </div>
                         </div>
                    </div>
                    <div class="project-info">
                        <h3 class="project-name">${p.name}</h3>
                        <div class="project-meta">
                            <span>${new Date(p.updatedAt).toLocaleDateString()}</span>
                            <span>${p.myRole || 'Editor'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async handleNewProject() {
        const name = document.getElementById('projectName').value;
        const category = document.getElementById('projectCategory').value;
        const desc = document.getElementById('projectDescription').value; // Corrected ID

        try {
            const res = await api.createProject({ name, category, description: desc });
            if (res.success) {
                const mappedCategory = this.mapCategory(category);
                window.location.href = `${mappedCategory}/${mappedCategory === 'chemistry' ? 'study.html' : 'index.html'}?id=${res.data.project._id}`;
            }
        } catch (e) {
            alert('Creation failed: ' + e.message);
        }
    }

    async handleRenameProject() {
        const id = document.getElementById('renameProjectId').value;
        const name = document.getElementById('renameProjectInput').value;

        try {
            const res = await api.request('PUT', `/projects/${id}`, { name });
            if (res.success) {
                document.getElementById('renameProjectModal').classList.remove('active');
                this.loadDashboardData(); // Refresh stats
                this.loadAllProjects('allProjectsList'); // Refresh project list
            } else {
                alert('Rename failed');
            }
        } catch (e) {
            alert('Error occurred: ' + e.message);
        }
    }

    async handleDeleteProject(id) {
        try {
            const res = await api.request('DELETE', `/projects/${id}`);
            if (res.success) {
                document.getElementById('deleteProjectModal').classList.remove('active');
                this.loadDashboardData(); // Refresh stats
                this.loadAllProjects('allProjectsList'); // Refresh project list
            } else {
                alert('Delete failed');
            }
        } catch (e) {
            alert('Error occurred: ' + e.message);
        }
    }

    async handleShareProject(id, role = 'editor') {
        try {
            const res = await api.generateShareLink(id, role);
            if (res.success) {
                const input = document.getElementById('shareLinkInput');
                input.value = res.data.shareLink;
                input.dataset.projectId = id;

                // Update UI buttons
                document.querySelectorAll('.role-opt').forEach(btn => {
                    if (btn.dataset.role === role) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });

                document.getElementById('shareProjectModal').classList.add('active');
            }
        } catch (e) {
            console.error('Share link generation failed', e);
            // Fallback
            const shareUrl = `${window.location.origin}/invite.html?token=demo_${id}`;
            document.getElementById('shareLinkInput').value = shareUrl;
            document.getElementById('shareProjectModal').classList.add('active');
        }
    }

    // Library Methods
    switchLibraryTab(tab) {
        const btnPdf = document.getElementById('tabPdf');
        const btnNotes = document.getElementById('tabNotes');
        const contentPdf = document.getElementById('libraryContentPdf');
        const contentNotes = document.getElementById('libraryContentNotes');

        if (btnPdf) btnPdf.className = tab === 'pdf' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost';
        if (btnNotes) btnNotes.className = tab === 'notes' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost';

        if (contentPdf) contentPdf.style.display = tab === 'pdf' ? 'block' : 'none';
        if (contentNotes) contentNotes.style.display = tab === 'notes' ? 'block' : 'none';

        if (tab === 'pdf') this.loadLibraryPdfs();
        else this.loadLibraryNotes();
    }

    async loadLibraryData() {
        this.switchLibraryTab('pdf');
    }

    async loadLibraryPdfs() {
        const container = document.getElementById('pdfList');
        if (!container) return;

        container.innerHTML = '<div class="loader"></div>';
        try {
            const res = await api.request('GET', '/library/pdfs');
            if (res.success && res.data.pdfs.length) {
                container.innerHTML = res.data.pdfs.map(pdf => `
                     <div class="card p-4" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
                        <div style="display:flex; align-items:center; gap: 12px; margin-bottom: 8px;">
                             <span class="material-icons-round" style="color: #ef4444;">picture_as_pdf</span>
                             <div>
                                <h4 style="font-weight:bold; margin:0;">${pdf.filename}</h4>
                                <p style="font-size:0.8rem; color: #94a3b8; margin:0;">${new Date(pdf.createdAt).toLocaleString()}</p>
                             </div>
                        </div>
                        <a href="${pdf.path}" class="btn btn-sm btn-outline" style="width:100%; text-align:center; display:block;" download>Download</a>
                    </div>
                `).join('');
            } else { container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">No saved PDFs found.</p>'; }
        } catch (e) { container.innerHTML = 'Error loading PDFs'; }
    }

    async loadLibraryNotes() {
        const container = document.getElementById('notesList');
        if (!container) return;

        container.innerHTML = '<div class="loader"></div>';
        try {
            const res = await api.request('GET', '/library/notes');
            if (res.success && res.data.notes.length) {
                container.innerHTML = res.data.notes.map(note => `
                    <div class="card p-4" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display:flex; justify-content:space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <div style="display:flex; align-items:center; gap: 8px; margin-bottom: 4px;">
                                    <span class="badge" style="background: rgba(79, 70, 229, 0.2); color: #818cf8; font-size: 11px;">${this.getWorkspaceNameKo(note.workspace) || 'General'}</span>
                                    <span style="font-size:0.75rem; color: #64748b;">${new Date(note.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <h4 style="font-size: 1.1rem; font-weight: 600; color: #f8fafc; margin: 0;">${note.title || 'Untitled'}</h4>
                                <p style="font-size: 0.85rem; color: #94a3b8; margin: 4px 0 0;">${note.linkedProjectId?.name || 'No linked project'}</p>
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button onclick="dashboard.handleDownloadNote('${note._id}')" class="btn btn-icon btn-ghost btn-sm" title="Download PDF" style="color: #fbbf24; padding: 4px;">
                                    <span class="material-icons-round" style="font-size: 18px;">picture_as_pdf</span>
                                </button>
                                <button onclick="dashboard.handleRenameNote('${note._id}', '${(note.title || '').replace(/'/g, "\\'")}')" class="btn btn-icon btn-ghost btn-sm" title="Rename" style="color: #60a5fa; padding: 4px;">
                                    <span class="material-icons-round" style="font-size: 18px;">edit</span>
                                </button>
                                <button onclick="dashboard.handleDeleteNote('${note._id}')" class="btn btn-icon btn-ghost btn-sm" title="Delete" style="color: #f87171; padding: 4px;">
                                    <span class="material-icons-round" style="font-size: 18px;">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else { container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">No notes found.</p>'; }
        } catch (e) { container.innerHTML = 'Error loading Notes'; }
    }

    async handleRenameNote(id, currentTitle) {
        document.getElementById('renameNoteId').value = id;
        document.getElementById('renameNoteInput').value = currentTitle;
        document.getElementById('renameNoteModal').classList.add('active');
    }

    async processRenameNote() {
        const id = document.getElementById('renameNoteId').value;
        const newTitle = document.getElementById('renameNoteInput').value.trim();

        if (!newTitle) {
            alert('Please enter a note title.');
            return;
        }

        try {
            const res = await api.updateNote(id, { title: newTitle });
            if (res.success) {
                document.getElementById('renameNoteModal').classList.remove('active');
                this.loadLibraryNotes();
            }
        } catch (e) {
            alert('Rename failed: ' + e.message);
        }
    }

    async handleDeleteNote(id) {
        document.getElementById('deleteNoteId').value = id;
        document.getElementById('deleteNoteConfirmModal').classList.add('active');
    }

    async processDeleteNote() {
        const id = document.getElementById('deleteNoteId').value;
        try {
            const res = await api.deleteNote(id);
            if (res.success) {
                document.getElementById('deleteNoteConfirmModal').classList.remove('active');
                this.loadLibraryNotes();
            }
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    }

    async handleDownloadNote(id) {
        try {
            const res = await api.getNote(id);
            if (res.success) {
                const note = res.data.note;
                await this.exportNoteToPDF(note);
            }
        } catch (e) {
            alert('Download failed: ' + e.message);
        }
    }

    async exportNoteToPDF(note) {
        console.log('Exporting note to PDF from dashboard:', note._id);

        // Load html2canvas and jsPDF if not exists
        if (typeof window.html2canvas === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }
        if (typeof window.jspdf === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
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
            img { max-width: 100% !important; height: auto !important; }
        </style>
    `;

        const date = new Date(note.updatedAt).toLocaleString('en-US');
        const wsNameKo = this.getWorkspaceNameKo(note.workspace);
        const displayTitle = note.title || `${wsNameKo} Study Note`;

        const htmlContent = `
            <div class="pdf-page">
                <div class="header">
                    <h1 style="margin: 0; color: #333; font-size: 26px;">${wsNameKo} Study Note</h1>
                    <p style="margin: 5px 0 0; color: #666; font-size: 14px;">${date}</p>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="margin: 0 0 15px; color: #333; font-size: 20px;">${displayTitle}</h2>
                    <div class="ql-editor">${note.content || ''}</div>
                </div>
            </div>
        `;

        container.innerHTML = pdfStyles + htmlContent;
        document.body.appendChild(container);

        // Wait for images
        await Promise.all(
            Array.from(container.querySelectorAll('img')).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
            })
        );

        const canvas = await window.html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png'); // Use PNG for quality
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
        const timeValue = now.toLocaleTimeString('en-US', { hour12: false });
        const fileName = `[${year}-${month}-${day} ${timeValue}] ${wsNameKo} Study Note.pdf`;
        doc.save(fileName);

        document.body.removeChild(container);
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    getWorkspaceNameKo(ws) {
        const map = { 'biology': 'Biology', 'chemistry': 'Chemistry', 'engineering': 'Engineering', 'earthscience': 'Earth Science', 'math': 'Math' };
        return map[ws] || ws;
    }

    async loadCollaborationData() {
        // Load all collaboration data
        await Promise.all([
            this.loadCollaborators(),
            this.loadCollaboratorRequests(),
            this.loadProjectInvitations(),
            this.loadSharedProjects()
        ]);
    }

    switchCollabTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.collab-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.collab-tab-content').forEach(content => {
            content.style.display = 'none';
        });

        const tabContent = document.getElementById(`collabTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
        if (tabContent) tabContent.style.display = 'block';
    }

    async loadCollaborators() {
        const container = document.getElementById('collaboratorsList');
        if (!container) return;

        container.innerHTML = '<div class="loader"></div>';

        try {
            const res = await api.getCollaborators();
            if (res.success) {
                const collaborators = res.data.collaborators;

                // Update badge
                const badge = document.getElementById('collabCountBadge');
                if (badge) {
                    badge.textContent = collaborators.length;
                    badge.style.display = collaborators.length > 0 ? 'inline-block' : 'none';
                }

                if (collaborators.length > 0) {
                    container.innerHTML = collaborators.map(c => {
                        const user = c.user;
                        const avatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
                        const displayName = c.nickname || user.name;

                        return `
                            <div class="collaborator-card" data-id="${c._id}">
                                <div class="collaborator-header">
                                    <img class="collaborator-avatar" src="${avatar}" alt="${displayName}">
                                    <div class="collaborator-info">
                                        <h4>${displayName}</h4>
                                        <p>${user.email}</p>
                                    </div>
                                </div>
                                ${c.note ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${c.note}</p>` : ''}
                                <div class="collaborator-actions">
                                    <button class="btn btn-sm btn-outline invite-collab-btn" data-email="${user.email}" data-name="${user.name}">
                                        <span class="material-icons-round" style="font-size: 16px;">send</span>
                                        Invite to Project
                                    </button>
                                    <button class="btn btn-sm btn-ghost remove-collab-btn" data-id="${c._id}" style="color: #ef4444;">
                                        <span class="material-icons-round" style="font-size: 16px;">person_remove</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');

                    // Attach event handlers
                    container.querySelectorAll('.remove-collab-btn').forEach(btn => {
                        btn.onclick = () => this.removeCollaborator(btn.dataset.id);
                    });

                    container.querySelectorAll('.invite-collab-btn').forEach(btn => {
                        btn.onclick = () => this.openInviteCollaboratorModal(btn.dataset.email, btn.dataset.name);
                    });
                } else {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <span class="material-icons-round" style="font-size: 48px; opacity: 0.3;">people</span>
                            <p style="margin-top: 12px;">No collaborators yet.</p>
                            <p style="font-size: 0.85rem;">Add collaborators to easily invite them to any project!</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Load collaborators error:', error);
            container.innerHTML = '<p class="text-danger">Failed to load collaborators.</p>';
        }
    }

    async loadCollaboratorRequests() {
        const pendingContainer = document.getElementById('pendingRequestsList');
        const sentContainer = document.getElementById('sentRequestsList');

        if (!pendingContainer || !sentContainer) return;

        pendingContainer.innerHTML = '<div class="loader"></div>';
        sentContainer.innerHTML = '<div class="loader"></div>';

        try {
            // Load received requests
            const pendingRes = await api.getCollaboratorPendingRequests();
            if (pendingRes.success) {
                const requests = pendingRes.data.requests;

                // Update badge
                const badge = document.getElementById('requestCountBadge');
                if (badge) {
                    badge.textContent = requests.length;
                    badge.style.display = requests.length > 0 ? 'inline-block' : 'none';
                }

                if (requests.length > 0) {
                    pendingContainer.innerHTML = requests.map(r => {
                        const from = r.from;
                        const avatar = from.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${from.name}`;

                        return `
                            <div class="request-card">
                                <img src="${avatar}" style="width: 44px; height: 44px; border-radius: 50%;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600;">${from.name}</h4>
                                    <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">${from.email}</p>
                                    ${r.note ? `<p style="margin: 6px 0 0; font-size: 0.8rem; color: var(--text-secondary);">"${r.note}"</p>` : ''}
                                </div>
                                <div style="display: flex; gap: 6px;">
                                    <button class="btn btn-sm btn-primary accept-req-btn" data-id="${r._id}">Accept</button>
                                    <button class="btn btn-sm btn-ghost reject-req-btn" data-id="${r._id}">Decline</button>
                                </div>
                            </div>
                        `;
                    }).join('');

                    pendingContainer.querySelectorAll('.accept-req-btn').forEach(btn => {
                        btn.onclick = () => this.acceptCollaboratorRequest(btn.dataset.id);
                    });
                    pendingContainer.querySelectorAll('.reject-req-btn').forEach(btn => {
                        btn.onclick = () => this.rejectCollaboratorRequest(btn.dataset.id);
                    });
                } else {
                    pendingContainer.innerHTML = '<p class="text-muted" style="padding: 10px;">No pending requests.</p>';
                }
            }

            // Load sent requests
            const sentRes = await api.getCollaboratorSentRequests();
            if (sentRes.success) {
                const requests = sentRes.data.requests;

                if (requests.length > 0) {
                    sentContainer.innerHTML = requests.map(r => {
                        const to = r.to;
                        const avatar = to.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${to.name}`;

                        return `
                            <div class="request-card">
                                <img src="${avatar}" style="width: 44px; height: 44px; border-radius: 50%;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600;">${to.name}</h4>
                                    <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">${to.email}</p>
                                </div>
                                <span style="font-size: 0.8rem; color: #f59e0b; display: flex; align-items: center; gap: 4px;">
                                    <span class="material-icons-round" style="font-size: 16px;">pending</span>
                                    Pending
                                </span>
                                <button class="btn btn-sm btn-ghost cancel-req-btn" data-id="${r._id}" style="color: #ef4444;">
                                    <span class="material-icons-round" style="font-size: 16px;">close</span>
                                </button>
                            </div>
                        `;
                    }).join('');

                    sentContainer.querySelectorAll('.cancel-req-btn').forEach(btn => {
                        btn.onclick = () => this.cancelCollaboratorRequest(btn.dataset.id);
                    });
                } else {
                    sentContainer.innerHTML = '<p class="text-muted" style="padding: 10px;">No sent requests.</p>';
                }
            }
        } catch (error) {
            console.error('Load requests error:', error);
        }
    }

    async loadProjectInvitations() {
        const inviteContainer = document.getElementById('invitationList');
        const countEl = document.getElementById('collabInviteCount');
        const badgeEl = document.getElementById('invitationCountBadge');

        if (!inviteContainer) return;

        inviteContainer.innerHTML = '<div class="loader"></div>';

        try {
            const inviteRes = await api.getMyInvitations();
            if (inviteRes.success) {
                const invites = inviteRes.data.invitations;

                if (countEl) countEl.textContent = invites.length;
                if (badgeEl) {
                    badgeEl.textContent = invites.length;
                    badgeEl.style.display = invites.length > 0 ? 'inline-block' : 'none';
                }
                if (document.getElementById('invitationCount')) {
                    document.getElementById('invitationCount').textContent = invites.length;
                    document.getElementById('invitationCount').style.display = invites.length > 0 ? 'inline-block' : 'none';
                }

                if (invites.length > 0) {
                    inviteContainer.innerHTML = invites.map(inv => `
                        <div class="request-card" style="margin-bottom: 12px;">
                            <img src="${inv.invitedBy.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + inv.invitedBy.name}" style="width: 48px; height: 48px; border-radius: 50%;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0; font-weight: 600;">${inv.projectId.name}</h4>
                                <p style="margin: 4px 0 0; font-size: 0.85rem; color: var(--text-muted);">${inv.invitedBy.name} invited you with ${inv.role === 'editor' ? 'Edit' : 'View'} permissions.</p>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-primary btn-sm accept-invite-btn" data-token="${inv.token}">Accept</button>
                                <button class="btn btn-ghost btn-sm">Decline</button>
                            </div>
                        </div>
                    `).join('');

                    inviteContainer.querySelectorAll('.accept-invite-btn').forEach(btn => {
                        btn.onclick = async () => {
                            try {
                                const res = await api.acceptInvitation(btn.dataset.token);
                                if (res.success) {
                                    this.showToast('Invitation accepted!', 'success');
                                    this.loadCollaborationData();
                                    this.loadDashboardData();
                                }
                            } catch (err) {
                                this.showToast('Accept failed: ' + err.message, 'error');
                            }
                        };
                    });
                } else {
                    inviteContainer.innerHTML = '<p class="text-muted" style="padding: 10px;">No pending project invitations.</p>';
                }
            }
        } catch (error) {
            console.error('Load invitations error:', error);
            inviteContainer.innerHTML = '<p class="text-danger">Failed to load invitations.</p>';
        }
    }

    async loadSharedProjects() {
        const sharedContainer = document.getElementById('sharedProjectList');
        if (!sharedContainer) return;

        sharedContainer.innerHTML = '<div class="loader"></div>';

        try {
            const projectsRes = await api.getProjects();
            if (projectsRes.success && this.currentUser) {
                const myId = this.currentUser._id;

                const sharedProjects = projectsRes.data.projects.filter(p => {
                    const ownerId = p.ownerId._id || p.ownerId;
                    return ownerId !== myId;
                });

                if (sharedProjects.length > 0) {
                    this.renderProjectList(sharedContainer, sharedProjects);
                } else {
                    sharedContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <span class="material-icons-round" style="font-size: 48px; opacity: 0.3;">folder_shared</span>
                            <p style="margin-top: 12px;">No shared projects yet.</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Load shared projects error:', error);
            sharedContainer.innerHTML = '<p class="text-danger">Failed to load shared projects.</p>';
        }
    }

    async searchCollaborators(query) {
        const dropdown = document.getElementById('collabSearchResults');
        if (!dropdown) return;

        if (!query || query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        try {
            const res = await api.searchUsersForCollaborator(query);
            if (res.success && res.data.users.length > 0) {
                dropdown.innerHTML = res.data.users.map(u => {
                    const avatar = u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`;
                    let statusBadge = '';
                    if (u.relationshipStatus === 'accepted') {
                        statusBadge = '<span style="font-size: 0.75rem; color: #10b981;">✓ Collaborator</span>';
                    } else if (u.relationshipStatus === 'pending') {
                        statusBadge = '<span style="font-size: 0.75rem; color: #f59e0b;">Pending</span>';
                    }

                    return `
                        <div class="search-result-item" data-email="${u.email}">
                            <img src="${avatar}">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size: 0.9rem;">${u.name}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${u.email}</div>
                            </div>
                            ${statusBadge}
                        </div>
                    `;
                }).join('');

                dropdown.querySelectorAll('.search-result-item').forEach(item => {
                    item.onclick = () => {
                        document.getElementById('addCollabEmail').value = item.dataset.email;
                        dropdown.style.display = 'none';
                    };
                });

                dropdown.style.display = 'block';
            } else {
                dropdown.innerHTML = '<div style="padding: 12px; color: var(--text-muted); text-align: center;">No users found</div>';
                dropdown.style.display = 'block';
            }
        } catch (error) {
            console.error('Search error:', error);
            dropdown.style.display = 'none';
        }
    }

    async sendCollaboratorRequest() {
        const emailInput = document.getElementById('addCollabEmail');
        const email = emailInput.value.trim();

        if (!email) {
            this.showToast('Please enter an email address.', 'error');
            return;
        }

        try {
            const res = await api.sendCollaboratorRequest(email);
            if (res.success) {
                this.showToast(res.message, 'success');
                emailInput.value = '';
                this.loadCollaborationData();
            }
        } catch (error) {
            this.showToast(error.message || 'Failed to send request.', 'error');
        }
    }

    async acceptCollaboratorRequest(requestId) {
        try {
            const res = await api.acceptCollaboratorRequest(requestId);
            if (res.success) {
                this.showToast('Collaborator added!', 'success');
                this.loadCollaborationData();
            }
        } catch (error) {
            this.showToast(error.message || 'Failed to accept request.', 'error');
        }
    }

    async rejectCollaboratorRequest(requestId) {
        try {
            const res = await api.rejectCollaboratorRequest(requestId);
            if (res.success) {
                this.showToast('Request declined.', 'success');
                this.loadCollaboratorRequests();
            }
        } catch (error) {
            this.showToast(error.message || 'Failed to decline request.', 'error');
        }
    }

    async cancelCollaboratorRequest(requestId) {
        try {
            const res = await api.cancelCollaboratorRequest(requestId);
            if (res.success) {
                this.showToast('Request cancelled.', 'success');
                this.loadCollaboratorRequests();
            }
        } catch (error) {
            this.showToast(error.message || 'Failed to cancel request.', 'error');
        }
    }

    async removeCollaborator(collaboratorId) {
        if (!confirm('Are you sure you want to remove this collaborator?')) return;

        try {
            const res = await api.removeCollaborator(collaboratorId);
            if (res.success) {
                this.showToast('Collaborator removed.', 'success');
                this.loadCollaborators();
            }
        } catch (error) {
            this.showToast(error.message || 'Failed to remove collaborator.', 'error');
        }
    }

    openInviteCollaboratorModal(email, name) {
        // For now, show a simple prompt to select project
        // This could be enhanced with a proper modal
        this.showToast(`Invite feature for ${name} coming soon!`, 'info');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.cssText = `
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 8px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    markAllRead() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '0';
        }
        const list = document.getElementById('notificationList');
        if (list) list.innerHTML = '<div class="text-center p-3 text-muted">No notifications</div>';
    }

    filterLists(term) {
        // Filter projects
        const projects = document.querySelectorAll('.project-card');
        projects.forEach(p => {
            const text = p.textContent.toLowerCase();
            p.style.display = text.includes(term) ? 'flex' : 'none';
        });

        // Filter library
        const libraryItems = document.querySelectorAll('#pdfList .card, #notesList .card');
        libraryItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(term) ? 'block' : 'none';
        });
    }
}


const dashboard = new Dashboard();
