// =============================================
// CENTRAL API CONFIG
// =============================================
const API_BASE = 'http://localhost:3000/api';

// =============================================
// HTTP HELPERS
// =============================================
async function apiGet(endpoint) {
  const token = localStorage.getItem('voterToken') || localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiPost(endpoint, body) {
  const token = localStorage.getItem('voterToken') || localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiPut(endpoint, body) {
  const token = localStorage.getItem('voterToken') || localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiDelete(endpoint) {
  const token = localStorage.getItem('voterToken') || localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// =============================================
// SHOW TOAST NOTIFICATION
// =============================================
function showToast(msg, type = 'success') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.style.cssText = `
      position:fixed; bottom:2rem; right:2rem; z-index:9999;
      padding:14px 20px; border-radius:12px; font-size:14px;
      font-weight:600; font-family:'Segoe UI',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,0.15);
      transition:all 0.3s; transform:translateY(100px); opacity:0;
      max-width:360px;
    `;
    document.body.appendChild(toast);
  }
  const colors = {
    success: { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
    error:   { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
    info:    { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe' },
    warning: { bg:'#fffbeb', color:'#d97706', border:'#fde68a' }
  };
  const c = colors[type] || colors.success;
  toast.style.background = c.bg;
  toast.style.color = c.color;
  toast.style.border = `1px solid ${c.border}`;
  toast.textContent = msg;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 3500);
}

// =============================================
// AUTH HELPERS
// =============================================
function getAdminData() {
  return JSON.parse(localStorage.getItem('adminData') || '{}');
}

function getVoterData() {
  return JSON.parse(localStorage.getItem('voterData') || '{}');
}

function isAdminLoggedIn() {
  return !!localStorage.getItem('adminToken');
}

function isVoterLoggedIn() {
  return !!localStorage.getItem('voterToken');
}

function adminLogout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  window.location.href = '../admin/index.html';
}

function voterLogout() {
  localStorage.removeItem('voterToken');
  localStorage.removeItem('voterData');
  window.location.href = '../user/index.html';
}