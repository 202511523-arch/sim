/**
 * SIMVEX API Client
 * Handles all API calls to the backend
 */

// const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = 'https://simvexdong.onrender.com/api'; // isLocal ? 'http://localhost:3000/api' : 'https://simvexdong.onrender.com/api';

class API {
    constructor() {
        this.token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
    }

    /**
     * Set auth token
     */
    setToken(token, remember = true) {
        this.token = token;
        if (remember) {
            sessionStorage.removeItem('simvex_token');
            localStorage.setItem('simvex_token', token);
        } else {
            localStorage.removeItem('simvex_token');
            sessionStorage.setItem('simvex_token', token);
        }
    }

    /**
     * Clear auth token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('simvex_token');
        sessionStorage.removeItem('simvex_token');
    }

    /**
     * Get auth headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make API request
     */
    async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: this.getHeaders()
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`API Request: ${method} ${endpoint}`, options);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            console.log(`API Response: ${method} ${endpoint}`, response.status);

            const result = await response.json();
            console.log(`API Data: ${method} ${endpoint}`, result);

            if (!response.ok) {
                throw new Error(result.message || 'Request failed');
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Upload file
     */
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);

        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        });

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Upload failed');
        }

        return result;
    }

    // ==================== Auth ====================

    async register(email, password, name) {
        const result = await this.request('POST', '/auth/register', { email, password, name });
        if (result.data?.token) {
            this.setToken(result.data.token);
        }
        return result;
    }

    async login(email, password) {
        const result = await this.request('POST', '/auth/login', { email, password });
        if (result.data?.token) {
            this.setToken(result.data.token);
        }
        return result;
    }

    async getMe() {
        return this.request('GET', '/auth/me');
    }

    async updateProfile(data) {
        return this.request('PUT', '/auth/me', data);
    }

    async verifyEmail(token) {
        return this.request('POST', '/auth/verify-email', { token });
    }

    async forgotPassword(email) {
        return this.request('POST', '/auth/forgot-password', { email });
    }

    async resetPassword(token, password) {
        return this.request('POST', '/auth/reset-password', { token, password });
    }

    // ==================== Projects ====================

    async getProjects(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/projects${query ? `?${query}` : ''}`);
    }

    async getProject(id) {
        return this.request('GET', `/projects/${id}`);
    }

    async createProject(data) {
        return this.request('POST', '/projects', data);
    }

    async updateProject(id, data) {
        return this.request('PUT', `/projects/${id}`, data);
    }

    async deleteProject(id) {
        return this.request('DELETE', `/projects/${id}`);
    }

    // ==================== Versions ====================

    async getVersions(projectId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/projects/${projectId}/versions${query ? `?${query}` : ''}`);
    }

    async getVersion(projectId, versionId) {
        return this.request('GET', `/projects/${projectId}/versions/${versionId}`);
    }

    async createVersion(projectId, data) {
        return this.request('POST', `/projects/${projectId}/versions`, data);
    }

    async restoreVersion(projectId, versionId) {
        return this.request('POST', `/projects/${projectId}/versions/${versionId}/restore`);
    }

    // ==================== Members ====================

    async getMembers(projectId) {
        return this.request('GET', `/projects/${projectId}/members`);
    }

    async updateMember(projectId, userId, role) {
        return this.request('PUT', `/projects/${projectId}/members/${userId}`, { role });
    }

    async removeMember(projectId, userId) {
        return this.request('DELETE', `/projects/${projectId}/members/${userId}`);
    }

    // ==================== Invitations ====================

    async inviteToProject(projectId, email, role, message = '') {
        return this.request('POST', `/invitations/projects/${projectId}/invite`, { email, role, message });
    }

    async getProjectInvitations(projectId) {
        return this.request('GET', `/invitations/projects/${projectId}/invitations`);
    }

    async getMyInvitations() {
        return this.request('GET', '/invitations/my/pending');
    }

    async getInvitation(token) {
        return this.request('GET', `/invitations/${token}`);
    }

    async acceptInvitation(token) {
        return this.request('POST', `/invitations/${token}/accept`);
    }

    async generateShareLink(projectId, role, expiresInDays = 7) {
        return this.request('POST', `/invitations/projects/${projectId}/share-link`, { role, expiresInDays });
    }

    // ==================== Assets ====================

    async getAssets(projectId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/assets/projects/${projectId}/assets${query ? `?${query}` : ''}`);
    }

    async uploadAsset(projectId, file, name = '', tags = []) {
        return this.uploadFile(`/assets/projects/${projectId}/assets`, file, { name, tags });
    }

    async deleteAsset(assetId) {
        return this.request('DELETE', `/assets/${assetId}`);
    }

    // ==================== Notes ====================

    async getNotes(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/notes${query ? `?${query}` : ''}`);
    }

    async getNote(id) {
        return this.request('GET', `/notes/${id}`);
    }

    async createNote(data) {
        return this.request('POST', '/notes', data);
    }

    async updateNote(id, data) {
        return this.request('PUT', `/notes/${id}`, data);
    }

    async deleteNote(id) {
        return this.request('DELETE', `/notes/${id}`);
    }

    async toggleNotePin(id) {
        return this.request('PUT', `/notes/${id}/pin`);
    }

    // Dashboard & Notifications
    async getDashboardStats() {
        return this.request('GET', '/dashboard/stats');
    }

    async getDashboardActivity() {
        return this.request('GET', '/dashboard/activity');
    }

    async getNotifications() {
        return this.request('GET', '/notifications');
    }

    // ==================== Users ====================

    async searchUsers(query) {
        return this.request('GET', `/users/search?q=${encodeURIComponent(query)}`);
    }

    async getUser(id) {
        return this.request('GET', `/users/${id}`);
    }

    // ==================== Collaborators ====================

    async getCollaborators() {
        return this.request('GET', '/collaborators');
    }

    async getCollaboratorPendingRequests() {
        return this.request('GET', '/collaborators/requests/pending');
    }

    async getCollaboratorSentRequests() {
        return this.request('GET', '/collaborators/requests/sent');
    }

    async sendCollaboratorRequest(email, note = '') {
        return this.request('POST', '/collaborators/request', { email, note });
    }

    async acceptCollaboratorRequest(requestId) {
        return this.request('POST', `/collaborators/requests/${requestId}/accept`);
    }

    async rejectCollaboratorRequest(requestId) {
        return this.request('POST', `/collaborators/requests/${requestId}/reject`);
    }

    async updateCollaborator(id, data) {
        return this.request('PUT', `/collaborators/${id}`, data);
    }

    async removeCollaborator(id) {
        return this.request('DELETE', `/collaborators/${id}`);
    }

    async cancelCollaboratorRequest(requestId) {
        return this.request('DELETE', `/collaborators/requests/${requestId}/cancel`);
    }

    async searchUsersForCollaborator(query) {
        return this.request('GET', `/collaborators/search?q=${encodeURIComponent(query)}`);
    }
}

// Export singleton instance
const api = new API();

// Check if logged in on page load
if (!api.token && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
    // Redirect to login if not authenticated
    // window.location.href = '/login.html';
}
