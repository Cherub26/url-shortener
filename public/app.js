// API Configuration
const BASE_URL = '/api';

// Global state
let currentUser = null;
let currentRoute = '/';

// Utility functions
function getToken() {
    return localStorage.getItem('jwt');
}

function setToken(token) {
    localStorage.setItem('jwt', token);
}

function removeToken() {
    localStorage.removeItem('jwt');
}

function parseJWT(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch {
        return null;
    }
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// API Service
class ApiService {
    async request(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const token = getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async login(username, password) {
        return this.request('/user/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async register(username, password) {
        return this.request('/user/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async shortenUrl(longUrl) {
        return this.request('/shorten', {
            method: 'POST',
            body: JSON.stringify({ url: longUrl })
        });
    }

    async getUserLinks() {
        return this.request('/user/links', {
            method: 'GET'
        });
    }
}

const api = new ApiService();

// Router
class Router {
    constructor() {
        this.routes = {
            '/': this.showHome,
            '/login': this.showLogin,
            '/register': this.showRegister,
            '/links': this.showLinks
        };

        this.init();
    }

    init() {
        window.addEventListener('popstate', () => this.navigate(window.location.pathname));
        this.navigate(window.location.pathname);
    }

    navigate(path) {
        currentRoute = path;
        window.history.pushState({}, '', path);

        const handler = this.routes[path] || this.showNotFound;
        handler.call(this);

        this.updateNavigation();
    }

    updateNavigation() {
        const userMenuContainer = document.getElementById('user-menu-container');

        if (currentUser) {
            userMenuContainer.innerHTML = `
                <div class="user-menu" onclick="toggleUserMenu()">
                    <span class="user-name">${currentUser.username}</span>
                    <span class="material-icons">arrow_drop_down</span>
                </div>
                <div id="user-dropdown" class="user-dropdown" style="display: none;">
                    <button class="dropdown-item" onclick="router.navigate('/links')">
                        <span class="material-icons">link</span>
                        <span>Links</span>
                    </button>
                    <button class="dropdown-item" onclick="openLogoutDialog()">
                        <span class="material-icons">logout</span>
                        <span>Logout</span>
                    </button>
                </div>
            `;
        } else {
            userMenuContainer.innerHTML = `
                <button class="btn btn-primary" onclick="router.navigate('/login')">Login</button>
            `;
        }
    }

    showHome() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="center-card">
                <h1>Shorten your link</h1>
                <p class="subtitle">Paste your long URL below</p>
                <form class="shorten-form" onsubmit="handleShortenUrl(event)">
                    <div class="form-field">
                        <input type="url" id="longUrl" placeholder="Paste your long URL here" required />
                    </div>
                    <button type="submit" class="btn btn-primary">Shorten</button>
                </form>
                <div id="shortUrlResult" style="display: none;" class="short-url-result">
                    <span>Short URL:</span>
                    <a id="shortUrlLink" href="" target="_blank"></a>
                    <button class="btn btn-stroked" onclick="copyShortUrl()">Copy</button>
                </div>
                <div id="error" style="display: none;" class="error"></div>
                ${!currentUser ? `
                    <div class="guest-info">
                        <p>Want to track your links? <button class="link-btn" onclick="router.navigate('/login')">Login</button> or <button class="link-btn" onclick="router.navigate('/register')">Register</button></p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showLogin() {
        // Redirect to home if user is already logged in
        if (currentUser) {
            this.navigate('/');
            return;
        }

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="center-card">
                <h1>Login</h1>
                <form class="shorten-form" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <div class="form-field">
                            <input type="text" id="loginUsername" placeholder="Username" required />
                        </div>
                        <div class="form-field password-field">
                            <input type="password" id="loginPassword" placeholder="Password" required />
                            <button type="button" class="password-toggle" onclick="togglePasswordVisibility('loginPassword')">
                                <span class="material-icons">visibility</span>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
                <div id="error" style="display: none;" class="error"></div>
                <div class="guest-info">
                    <p>Don't have an account? <button class="link-btn" onclick="router.navigate('/register')">Register</button></p>
                </div>
            </div>
        `;
    }

    showRegister() {
        // Redirect to home if user is already logged in
        if (currentUser) {
            this.navigate('/');
            return;
        }

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="center-card">
                <h1>Register</h1>
                <form class="shorten-form" onsubmit="handleRegister(event)">
                    <div class="form-group">
                        <div class="form-field">
                            <input type="text" id="registerUsername" placeholder="Username" required maxlength="20" />
                        </div>
                        <div class="form-field password-field">
                            <input type="password" id="registerPassword" placeholder="Password" required />
                            <button type="button" class="password-toggle" onclick="togglePasswordVisibility('registerPassword')">
                                <span class="material-icons">visibility</span>
                            </button>
                        </div>
                        <div class="form-field password-field">
                            <input type="password" id="confirmPassword" placeholder="Confirm Password" required />
                            <button type="button" class="password-toggle" onclick="togglePasswordVisibility('confirmPassword')">
                                <span class="material-icons">visibility</span>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Register</button>
                </form>
                <div id="error" style="display: none;" class="error"></div>
                <div class="guest-info">
                    <p>Already have an account? <button class="link-btn" onclick="router.navigate('/login')">Login</button></p>
                </div>
            </div>
        `;
    }

    showLinks() {
        if (!currentUser) {
            this.navigate('/login');
            return;
        }

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="links-container">
                <div class="links-card">
                    <h1>Your Links</h1>
                    <div id="linksContent">
                        <div class="loading">Loading your links...</div>
                    </div>
                </div>
            </div>
        `;

        this.loadUserLinks();
    }

    showNotFound() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="center-card">
                <h1>404 - Page Not Found</h1>
                <p class="subtitle">The page you're looking for doesn't exist.</p>
                <button class="btn btn-primary" onclick="router.navigate('/')">Go Home</button>
            </div>
        `;
    }

    async loadUserLinks() {
        try {
            const links = await api.getUserLinks();
            const linksContent = document.getElementById('linksContent');

            if (links && links.length > 0) {
                const linksList = links.map(link => `
                    <div class="link-item">
                        <h3><a href="${link.shortUrl}" target="_blank" rel="noopener noreferrer">${link.shortUrl}</a></h3>
                        <p>${link.longUrl}</p>
                        <div class="link-stats">Clicks: ${link.clickCount || 0}</div>
                    </div>
                `).join('');

                linksContent.innerHTML = `<ul class="links-list">${linksList}</ul>`;
            } else {
                linksContent.innerHTML = `
                    <div class="loading">
                        <p>No links found. Create your first short link on the home page!</p>
                        <button class="btn btn-primary" onclick="router.navigate('/')">Go Home</button>
                    </div>
                `;
            }
        } catch (error) {
            const linksContent = document.getElementById('linksContent');
            linksContent.innerHTML = `
                <div class="error">Failed to load links: ${error.message}</div>
            `;
        }
    }
}

// Event handlers
async function handleShortenUrl(event) {
    event.preventDefault();

    const longUrl = document.getElementById('longUrl').value;
    const errorDiv = document.getElementById('error');
    const resultDiv = document.getElementById('shortUrlResult');

    // Clear previous results
    errorDiv.style.display = 'none';
    resultDiv.style.display = 'none';

    if (!longUrl) return;

    if (!isValidUrl(longUrl)) {
        errorDiv.textContent = 'Please enter a valid URL (e.g. https://example.com)';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const result = await api.shortenUrl(longUrl);
        const shortUrlLink = document.getElementById('shortUrlLink');
        shortUrlLink.href = result.shortUrl;
        shortUrlLink.textContent = result.shortUrl;
        resultDiv.style.display = 'flex';
        document.getElementById('longUrl').value = '';
    } catch (error) {
        errorDiv.textContent = error.message || 'Failed to shorten URL';
        errorDiv.style.display = 'block';
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('error');

    errorDiv.style.display = 'none';

    try {
        const result = await api.login(username, password);
        setToken(result.token);
        currentUser = parseJWT(result.token);
        router.navigate('/');
    } catch (error) {
        errorDiv.textContent = error.message || 'Login failed';
        errorDiv.style.display = 'block';
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('error');

    errorDiv.style.display = 'none';

    if (username.length > 20) {
        errorDiv.textContent = 'Username must be at most 20 characters.';
        errorDiv.style.display = 'block';
        return;
    }
    if (password.length < 8) {
        errorDiv.textContent = 'Password must be at least 8 characters.';
        errorDiv.style.display = 'block';
        return;
    }
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        await api.register(username, password);
        router.navigate('/login');
    } catch (error) {
        errorDiv.textContent = error.message || 'Registration failed';
        errorDiv.style.display = 'block';
    }
}

function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add to body
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Hide and remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

function copyShortUrl() {
    const shortUrlLink = document.getElementById('shortUrlLink');
    if (shortUrlLink.href) {
        navigator.clipboard.writeText(shortUrlLink.href);
        showToast('Short URL copied to clipboard!');
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    const icon = toggle.querySelector('.material-icons');

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility';
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function openLogoutDialog() {
    document.getElementById('logout-dialog').style.display = 'flex';
}

function closeLogoutDialog() {
    document.getElementById('logout-dialog').style.display = 'none';
}

function confirmLogout() {
    removeToken();
    currentUser = null;
    closeLogoutDialog();
    router.navigate('/');
}

function initApp() {
    const token = getToken();
    if (token) {
        currentUser = parseJWT(token);
    }

    window.router = new Router();

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        const dropdown = document.getElementById('user-dropdown');
        const userMenu = document.querySelector('.user-menu');

        if (dropdown && userMenu && !userMenu.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 