const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api/v1'
    : 'https://saas-invoice-api.onrender.com/api/v1';

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

function isLoggedIn() {
    return !!getToken();
}

async function apiCall(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (response.status === 401 && token) {
        clearAuth();
        window.location.href = 'login.php';
        return null;
    }

    return { status: response.status, data };
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
