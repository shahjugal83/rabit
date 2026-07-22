const API_BASE = (() => {
    if (window.location.hostname === 'localhost') {
        return 'http://localhost:3001/api/v1';
    }
    return window.location.origin + '/api/v1';
})();

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token, userId) {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
}

function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
}

function setCompanyId(companyId) {
    if (companyId) {
        localStorage.setItem('companyId', companyId);
    } else {
        localStorage.removeItem('companyId');
    }
}

function getCompanyId() {
    return localStorage.getItem('companyId');
}

function isLoggedIn() {
    return !!getToken();
}

async function apiCall(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const companyId = getCompanyId();
    if (companyId && !endpoint.startsWith('/auth/')) {
        headers['X-Company-Id'] = companyId;
    }

    const config = { method, headers };
    if (body) {
        config.body = JSON.stringify(body);
    }

    const url = `${API_BASE}${endpoint}`;
    console.log(`[API] ➡ ${method} ${url}`, body ? { body } : '');

    try {
        const response = await fetch(url, config);
        const data = await response.json().catch(() => null);

        console.log(`[API] ⬅ ${response.status} ${method} ${endpoint}`, data ? { data } : '');

        if (response.status === 401 && token) {
            console.warn('[API] Token expired/invalid, clearing auth');
            clearAuth();
            window.location.href = 'login.html';
            return null;
        }

        return { status: response.status, data };
    } catch (err) {
        console.error(`[API] ❌ Network error: ${method} ${endpoint}`, err);
        return { status: 0, data: { message: 'Unable to connect to server. Please try again later.' } };
    }
}

function showFieldError(fieldId, message) {
    const el = document.getElementById(fieldId + '-error');
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
    }
}

function clearFieldErrors() {
    document.querySelectorAll('[id$="-error"]').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
}

function showGlobalError(message) {
    const el = document.getElementById('global-error');
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
    }
}

function hideGlobalError() {
    const el = document.getElementById('global-error');
    if (el) el.classList.add('hidden');
}

async function apiGet(endpoint) {
    const result = await apiCall('GET', endpoint);
    return result;
}

async function apiPost(endpoint, body) {
    const result = await apiCall('POST', endpoint, body);
    return result;
}

async function apiPut(endpoint, body) {
    const result = await apiCall('PUT', endpoint, body);
    return result;
}

function hasFeature(featureKey) {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return false;
        const user = JSON.parse(userStr);
        const companies = user.companies || [];
        return companies.some(c => {
            if (c.features && c.features[featureKey]) return true;
            return false;
        });
    } catch (e) {
        return false;
    }
}

function hasPermission(resource, action) {
    try {
        var user = getUserData();
        var companies = user.companies || [];
        return companies.some(function(c) {
            var role = c.role || {};
            var perms = role.permissions || [];
            return perms.some(function(p) {
                return p.resource === resource && p.action === action;
            });
        });
    } catch (e) {
        return false;
    }
}

function isSuperAdmin() {
    try {
        var user = getUserData();
        var companies = user.companies || [];
        return companies.some(function(c) {
            return c.role && c.role.name === 'SUPER_ADMIN';
        });
    } catch (e) {
        return false;
    }
}

function setUserData(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
}

function getUserData() {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
        return {};
    }
}

async function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return null;
    }

    var user = getUserData();
    if (user && user.userId) {
        return user;
    }

    var result = await apiCall('GET', '/auth/me');
    if (!result || result.status !== 200) {
        clearAuth();
        window.location.href = 'login.html';
        return null;
    }

    setUserData(result.data);
    return result.data;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
