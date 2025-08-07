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

function formatDateDDMMYYYY(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const timezone = d.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${timezone}`;
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
            let data = null;
            if (response.status !== 204) {
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            }
            if (!response.ok) {
                throw new Error((data && (data.error || data.message)) || 'Request failed');
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

    async shortenUrl(longUrl, expiresAt = null) {
        const body = { url: longUrl };
        if (expiresAt) body.expires_at = expiresAt;
        return this.request('/shorten', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async getUserLinks() {
        return this.request('/user/links', {
            method: 'GET'
        });
    }

    async deleteUserLink(shortId) {
        return this.request(`/shorten/${shortId}`, {
            method: 'DELETE'
        });
    }

    async updateLinkExpiration(shortId, expiresAt) {
        return this.request(`/shorten/${shortId}/expiration`, {
            method: 'POST',
            body: JSON.stringify({ expires_at: expiresAt })
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
        document.querySelector('main').classList.remove('links-top-align');
        mainContent.innerHTML = `
            <div class="center-card">
                <h1>Shorten your link</h1>
                <p class="subtitle">Paste your long URL below</p>
                <form class="shorten-form" onsubmit="handleShortenUrl(event)">
                    <div class="form-field">
                        <input type="url" id="longUrl" placeholder="Paste your long URL here" required />
                    </div>
                    <div class="form-field">
                        <label for="expirationPreset" style="color:#eedee7; font-size:0.95rem; margin-bottom:0.2rem; display:block;">Expiration (optional):</label>
                        <select id="expirationPreset" style="width:100%; padding:0.5rem; border-radius:6px; border:1.5px solid #e040fb; background:#3e143e; color:#eedee7; margin-bottom:0.5rem;">
                            <option value="">No expiration</option>
                            <option value="1d">1 day</option>
                            <option value="1w">1 week</option>
                            <option value="1m">1 month</option>
                            <option value="1y">1 year</option>
                            <option value="custom">Custom date & time</option>
                        </select>
                        <input type="datetime-local" id="customExpirationDate" step="60" style="width:100%; padding:0.5rem; border-radius:6px; border:1.5px solid #e040fb; background:#3e143e; color:#eedee7; display:none; margin-top:0.3rem;" />
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
        const preset = document.getElementById('expirationPreset');
        const customDate = document.getElementById('customExpirationDate');
        preset.addEventListener('change', function() {
            if (this.value === 'custom') {
                customDate.style.display = 'block';
                customDate.required = true;
                // Set min to now (local time)
                const now = new Date();
                const pad = n => n.toString().padStart(2, '0');
                const min = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                customDate.min = min;
            } else {
                customDate.style.display = 'none';
                customDate.required = false;
                customDate.value = '';
            }
        });
    }

    showLogin() {
        // Redirect to home if user is already logged in
        if (currentUser) {
            this.navigate('/');
            return;
        }

        const mainContent = document.getElementById('main-content');
        document.querySelector('main').classList.remove('links-top-align');
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
        document.querySelector('main').classList.remove('links-top-align');
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
        document.querySelector('main').classList.add('links-top-align');
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
        document.querySelector('main').classList.remove('links-top-align');
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
                const linksList = links.map((link, idx) => {
                    // Determine status
                    let status = 'Active';
                    let statusClass = 'link-status-active';
                    let expired = false;
                    if (!link.isActive) {
                        status = 'Inactive';
                        statusClass = 'link-status-inactive';
                    } else if (link.expiresAt) {
                        const now = new Date();
                        const exp = new Date(link.expiresAt);
                        if (exp < now) {
                            status = 'Expired';
                            statusClass = 'link-status-expired';
                            expired = true;
                        }
                    }
                    let expiresDisplay = '';
                    if (link.expiresAt) {
                        const expDate = new Date(link.expiresAt);
                        expiresDisplay = ` (expires: ${formatDateDDMMYYYY(expDate)} )`;
                    }
                    return `
                        <div class="link-item${!link.isActive || expired ? ' link-item-inactive' : ''}" id="link-item-${idx}" style="position: relative; overflow: hidden;">
                            <h3><a href="${window.location.origin}/api/${link.shortUrl.split('/').pop()}" target="_blank" rel="noopener noreferrer">${window.location.origin}/api/${link.shortUrl.split('/').pop()}</a></h3>
                            <p>${link.longUrl}</p>
                            <div class="link-status ${statusClass}">${status}${expiresDisplay}</div>
                            <button class="btn btn-stats" onclick="showLinkStats('${link.shortUrl.split('/').pop()}', ${idx})">Statistics</button>
                            <button class="btn btn-edit" onclick="openEditDialog('${link.shortUrl.split('/').pop()}', ${idx}, '${link.expiresAt || ''}')">Edit</button>
                            <button class="btn btn-delete" onclick="openDeleteDialog('${link.shortUrl.split('/').pop()}', ${idx})">Delete</button>
                            <div class="stats-summary" id="stats-summary-${idx}" style="display:none;"></div>
                        </div>
                    `;
                }).join('');

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

// Add global function to fetch and show stats
window.showLinkStats = async function(shortId, idx) {
    const statsDiv = document.getElementById(`stats-summary-${idx}`);
    if (statsDiv.style.display === 'block') {
        statsDiv.style.display = 'none';
        statsDiv.innerHTML = '';
        return;
    }
    statsDiv.style.display = 'block';
    statsDiv.innerHTML = '<div class="loading">Loading statistics...</div>';
    try {
        const response = await fetch(`/api/stats/${shortId}/summary`);
        if (!response.ok) throw new Error('Failed to fetch statistics');
        const stats = await response.json();
        statsDiv.innerHTML = `
            <div class="stats-block">
                <strong>Total Clicks:</strong> ${stats.totalClicks}<br/>
                <strong>By Country:</strong> ${stats.byCountry.map(c => `${c.country || 'Unknown'} (${c.count})`).join(', ') || 'None'}<br/>
                <strong>By Browser:</strong> ${stats.byBrowser.map(b => `${b.browser || 'Unknown'} (${b.count})`).join(', ') || 'None'}<br/>
                <strong>By OS:</strong> ${stats.byOs.map(o => `${o.os || 'Unknown'} (${o.count})`).join(', ') || 'None'}<br/>
                <strong>By Device:</strong> ${stats.byDevice.map(d => `${d.device || 'Unknown'} (${d.count})`).join(', ') || 'None'}
            </div>
        `;
    } catch (error) {
        statsDiv.innerHTML = `<div class="error">${error.message}</div>`;
    }
};

let deleteDialogShortId = null;
let deleteDialogIdx = null;
let editDialogShortId = null;
let editDialogIdx = null;

window.openDeleteDialog = function(shortId, idx) {
    deleteDialogShortId = shortId;
    deleteDialogIdx = idx;
    document.getElementById('delete-dialog').style.display = 'flex';
};

window.closeDeleteDialog = function() {
    deleteDialogShortId = null;
    deleteDialogIdx = null;
    document.getElementById('delete-dialog').style.display = 'none';
};

window.confirmDeleteLink = async function() {
    if (!deleteDialogShortId) return;
    try {
        await api.deleteUserLink(deleteDialogShortId);
        showToast('Link deleted successfully!');
        // Remove the link from the UI
        const linkItem = document.getElementById(`link-item-${deleteDialogIdx}`);
        if (linkItem) linkItem.remove();
    } catch (error) {
        showToast(error.message || 'Failed to delete link', 'error');
    }
    closeDeleteDialog();
};

window.openEditDialog = function(shortId, idx, currentExpiresAt) {
    editDialogShortId = shortId;
    editDialogIdx = idx;
    
    // Set up the edit dialog
    const editDialog = document.getElementById('edit-dialog');
    const expirationPreset = document.getElementById('editExpirationPreset');
    const customDate = document.getElementById('editCustomExpirationDate');
    
    // Set current expiration value
    if (currentExpiresAt) {
        // Convert UTC to local datetime-local format
        const date = new Date(currentExpiresAt);
        const pad = n => n.toString().padStart(2, '0');
        const localDateTime = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        customDate.value = localDateTime;
        expirationPreset.value = 'custom';
        customDate.style.display = 'block';
        customDate.required = true;
    } else {
        expirationPreset.value = '';
        customDate.value = '';
        customDate.style.display = 'none';
        customDate.required = false;
    }
    
    // Set min date to now
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const min = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    customDate.min = min;
    
    // Add event listener for expiration selector
    expirationPreset.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDate.style.display = 'block';
            customDate.required = true;
        } else {
            customDate.style.display = 'none';
            customDate.required = false;
            customDate.value = '';
        }
    });
    
    editDialog.style.display = 'flex';
};

window.closeEditDialog = function() {
    editDialogShortId = null;
    editDialogIdx = null;
    document.getElementById('edit-dialog').style.display = 'none';
};

window.confirmEditLink = async function() {
    if (!editDialogShortId) return;
    
    const expirationPreset = document.getElementById('editExpirationPreset');
    const customDate = document.getElementById('editCustomExpirationDate');
    
    // Calculate expires_at in UTC if set
    let expiresAt = null;
    if (expirationPreset.value) {
        if (expirationPreset.value === 'custom') {
            if (!customDate.value) {
                showToast('Please select a custom expiration date and time.', 'error');
                return;
            }
            // Convert local datetime to UTC ISO string
            expiresAt = new Date(customDate.value).toISOString();
        } else {
            // Preset durations
            const now = new Date();
            switch (expirationPreset.value) {
                case '1d':
                    now.setUTCDate(now.getUTCDate() + 1);
                    break;
                case '1w':
                    now.setUTCDate(now.getUTCDate() + 7);
                    break;
                case '1m':
                    now.setUTCMonth(now.getUTCMonth() + 1);
                    break;
                case '1y':
                    now.setUTCFullYear(now.getUTCFullYear() + 1);
                    break;
            }
            // Set to end of day UTC
            now.setUTCHours(23, 59, 59, 999);
            expiresAt = now.toISOString();
        }
    }
    
    try {
        await api.updateLinkExpiration(editDialogShortId, expiresAt);
        showToast('Link expiration updated successfully!');
        
        // Reload the links to show updated expiration
        router.loadUserLinks();
        
        closeEditDialog();
    } catch (error) {
        showToast(error.message || 'Failed to update link expiration', 'error');
    }
};

// Event handlers
async function handleShortenUrl(event) {
    event.preventDefault();

    const longUrl = document.getElementById('longUrl').value;
    const errorDiv = document.getElementById('error');
    const resultDiv = document.getElementById('shortUrlResult');
    const preset = document.getElementById('expirationPreset');
    const customDate = document.getElementById('customExpirationDate');

    // Clear previous results
    errorDiv.style.display = 'none';
    resultDiv.style.display = 'none';

    if (!longUrl) return;

    if (!isValidUrl(longUrl)) {
        errorDiv.textContent = 'Please enter a valid URL (e.g. https://example.com)';
        errorDiv.style.display = 'block';
        return;
    }

    // Calculate expires_at in UTC if set
    let expiresAt = null;
    if (preset.value) {
        if (preset.value === 'custom') {
            if (!customDate.value) {
                errorDiv.textContent = 'Please select a custom expiration date and time.';
                errorDiv.style.display = 'block';
                return;
            }
            // Prevent past date
            const selected = new Date(customDate.value);
            const now = new Date();
            if (selected < now) {
                showToast('Expiration date must be in the future.', 'error');
                return;
            }
            // Convert local datetime to UTC ISO string
            expiresAt = new Date(customDate.value).toISOString();
        } else {
            // Preset durations
            const now = new Date();
            switch (preset.value) {
                case '1d':
                    now.setUTCDate(now.getUTCDate() + 1);
                    break;
                case '1w':
                    now.setUTCDate(now.getUTCDate() + 7);
                    break;
                case '1m':
                    now.setUTCMonth(now.getUTCMonth() + 1);
                    break;
                case '1y':
                    now.setUTCFullYear(now.getUTCFullYear() + 1);
                    break;
            }
            // Set to end of day UTC
            now.setUTCHours(23, 59, 59, 999);
            expiresAt = now.toISOString();
        }
    }

    try {
        const result = await api.shortenUrl(longUrl, expiresAt);
        const shortId = result.shortUrl.split('/').pop();
        const displayShortUrl = `${window.location.origin}/api/${shortId}`;
        const shortUrlLink = document.getElementById('shortUrlLink');
        shortUrlLink.href = displayShortUrl;
        shortUrlLink.textContent = displayShortUrl;
        resultDiv.style.display = 'flex';
        document.getElementById('longUrl').value = '';
        preset.value = '';
        customDate.value = '';
        customDate.style.display = 'none';
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