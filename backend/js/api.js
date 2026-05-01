// =============================================
// CENTRAL API CONFIG
// =============================================
const API_BASE = 'http://localhost:3000/api';

// =============================================
// HTTP HELPERS
// =============================================

/**
 * Make GET request to API
 */
async function apiGet(endpoint) {
  const token = localStorage.getItem('voterToken') || localStorage.getItem('adminToken');
  
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;

  } catch (error) {
    console.error('❌ API GET Error:', error);
    throw error;
  }
}

/**
 * Make POST request to API
 */
async function apiPost(endpoint, body) {
  const token = localStorage.getItem('voterToken') || localStorage.getItem('adminToken');

  try {
    console.log('📤 POST', endpoint, body);

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    console.log('📥 Response:', res.status, data);

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;

  } catch (error) {
    console.error('❌ API POST Error:', error);
    throw error;
  }
}

/**
 * Make PUT request to API
 */
async function apiPut(endpoint, body) {
  const token = localStorage.getItem('voterToken') || localStorage.getItem('adminToken');

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;

  } catch (error) {
    console.error('❌ API PUT Error:', error);
    throw error;
  }
}

/**
 * Make DELETE request to API
 */
async function apiDelete(endpoint) {
  const token = localStorage.getItem('voterToken') || localStorage.getItem('adminToken');

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;

  } catch (error) {
    console.error('❌ API DELETE Error:', error);
    throw error;
  }
}

// =============================================
// SHOW TOAST NOTIFICATION
// =============================================
function showToast(msg, type = 'success') {
  let toastContainer = document.getElementById('toastContainer');
  
  // Create container if doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 360px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: white;
    padding: 14px 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 13px;
    font-weight: 500;
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Segoe UI', sans-serif;
  `;

  const colors = {
    success: { border: '#16a34a', color: '#16a34a', icon: '✅' },
    error:   { border: '#dc2626', color: '#dc2626', icon: '❌' },
    warning: { border: '#f59e0b', color: '#f59e0b', icon: '⚠️' },
    info:    { border: '#1d4ed8', color: '#1d4ed8', icon: 'ℹ️' }
  };

  const c = colors[type] || colors.success;
  toast.style.borderLeft = `4px solid ${c.border}`;
  toast.style.color = c.color;
  toast.innerHTML = `<span>${c.icon}</span><span>${msg}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =============================================
// AUTH HELPERS
// =============================================

/**
 * Get admin data from localStorage
 */
function getAdminData() {
  const data = localStorage.getItem('adminData');
  return data ? JSON.parse(data) : {};
}

/**
 * Get voter data from localStorage
 */
function getVoterData() {
  const data = localStorage.getItem('voterData');
  return data ? JSON.parse(data) : {};
}

/**
 * Check if admin is logged in
 */
function isAdminLoggedIn() {
  return !!localStorage.getItem('adminToken');
}

/**
 * Check if voter is logged in
 */
function isVoterLoggedIn() {
  return !!localStorage.getItem('voterToken');
}

/**
 * Get current user token
 */
function getToken() {
  return localStorage.getItem('adminToken') || localStorage.getItem('voterToken');
}

/**
 * Admin logout
 */
function adminLogout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  showToast('✅ Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

/**
 * Voter logout
 */
function voterLogout() {
  localStorage.removeItem('voterToken');
  localStorage.removeItem('voterData');
  showToast('✅ Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// =============================================
// VOTER API FUNCTIONS
// =============================================

/**
 * Register as voter
 */
async function voterRegister(data) {
  return await apiPost('/auth/voter/register', {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    password: data.password,
    phone: data.phone,
    birthdate: data.birthdate,
    address: data.address
  });
}

/**
 * Voter login
 */
async function voterLogin(email, password) {
  return await apiPost('/auth/voter/login', {
    email,
    password
  });
}

/**
 * Verify voter OTP
 */
async function voterVerifyOTP(voterId, otp) {
  return await apiPost('/auth/voter/verify-otp', {
    voter_id: voterId,
    otp
  });
}

/**
 * Request password reset
 */
async function voterForgotPassword(email) {
  return await apiPost('/auth/voter/forgot-password', {
    email
  });
}

/**
 * Reset voter password
 */
async function voterResetPassword(email, resetCode, newPassword) {
  return await apiPost('/auth/voter/reset-password', {
    email,
    reset_code: resetCode,
    new_password: newPassword
  });
}

// =============================================
// ADMIN API FUNCTIONS
// =============================================

/**
 * Admin login
 */
async function adminLogin(email, password) {
  return await apiPost('/auth/admin-login', {
    email,
    password
  });
}

/**
 * Verify admin OTP
 */
async function adminVerifyOTP(email, otp) {
  return await apiPost('/auth/verify-admin-otp', {
    email,
    otp
  });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Format date to readable format
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if token is expired
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Decode JWT token
 */
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/**
 * Generate random ID
 */
function generateRandomId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength
 */
function isStrongPassword(password) {
  return password.length >= 6;
}

/**
 * Show loading spinner
 */
function showLoading() {
  const loader = document.createElement('div');
  loader.id = 'globalLoader';
  loader.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9998;
    width: 50px;
    height: 50px;
    border: 4px solid #e5e7eb;
    border-top-color: #1e3a8a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  `;
  document.body.appendChild(loader);
}

/**
 * Hide loading spinner
 */
function hideLoading() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.remove();
}

// =============================================
// INITIALIZATION
// =============================================

console.log('✅ API Helpers loaded');
console.log('📡 API Base:', API_BASE);

// Check if running in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🧪 Running in development mode');
}