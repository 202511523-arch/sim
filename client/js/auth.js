// Auth JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const githubLoginBtn = document.getElementById('githubLoginBtn');

    // API Base URL
    const API_BASE = 'https://simvexdong.onrender.com/api';

    // Toast notification
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="material-icons-round" style="font-size: 20px;">
                ${type === 'success' ? 'check_circle' :
                type === 'error' ? 'error' :
                    'info'}
            </span>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Check if user is already logged in
    const token = localStorage.getItem('simvex_token');
    if (token) {
        // Redirect to dashboard if already logged in
        window.location.href = 'dashboard.html';
    }

    // Login Form Handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe')?.checked;

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Clear any existing tokens first to avoid ambiguity
                    localStorage.removeItem('simvex_token');
                    sessionStorage.removeItem('simvex_token');

                    // Store token
                    if (rememberMe) {
                        localStorage.setItem('simvex_token', data.data.token);
                    } else {
                        sessionStorage.setItem('simvex_token', data.data.token);
                    }
                    localStorage.setItem('user', JSON.stringify(data.data.user));

                    showToast('Login successful!', 'success');

                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 500);
                } else {
                    showToast(data.message || 'Login failed.', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast('Server connection failed.', 'error');
            }
        });
    }

    // Register Form Handler
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const agreeTerms = document.getElementById('agreeTerms')?.checked;

            // Validation
            if (password !== confirmPassword) {
                showToast('Passwords do not match.', 'error');
                return;
            }

            if (password.length < 8) {
                showToast('Password must be at least 8 characters.', 'error');
                return;
            }

            if (!agreeTerms) {
                showToast('Please agree to the terms.', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('Registration successful! Please login.', 'success');

                    // Redirect to login
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showToast(data.message || 'Registration failed.', 'error');
                }
            } catch (error) {
                console.error('Register error:', error);
                showToast('Server connection failed.', 'error');
            }
        });
    }

    // Google Login Handler
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            // Redirect to Google OAuth
            window.location.href = `${API_BASE}/auth/google`;
        });
    }

    // GitHub Login Handler
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', () => {
            // Redirect to GitHub OAuth
            window.location.href = `${API_BASE}/auth/github`;
        });
    }

    // Check for OAuth callback token
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');
    if (oauthToken) {
        // Clear conflicting tokens
        sessionStorage.removeItem('simvex_token');
        localStorage.setItem('simvex_token', oauthToken);
        showToast('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    }

    // Handle OAuth error
    const error = urlParams.get('error');
    if (error) {
        showToast(decodeURIComponent(error), 'error');
    }
});
