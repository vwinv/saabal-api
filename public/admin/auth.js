// Shared authentication utilities for admin pages (global functions)

// Get JWT token from localStorage
function getToken() {
  return localStorage.getItem('jwt_token');
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getToken();
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/admin/login.html';
    return false;
  }
  return true;
}

// Logout function (global)
window.logout = function logout() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('jwt_refresh_token');
  localStorage.removeItem('user_info');
  window.location.href = '/admin/login.html';
};

// API helper with automatic token injection
async function fetchAPI(url, options = {}) {
  const token = getToken();
  if (!token) {
    requireAuth();
    throw new Error('Token JWT requis');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      logout();
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    // Format API d'erreur : { success: false, data: [], message: "..." }
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Erreur HTTP ${res.status}`);
  }

  const body = await res.json();
  // Format API : { success: boolean, data: [], message: "" }
  if (body && body.success === false) {
    throw new Error(body.message || 'Erreur serveur');
  }
  return body;
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
  // Skip auth check on login page
  if (window.location.pathname.includes('login.html')) {
    return;
  }
  
  // Check if authenticated, redirect if not
  requireAuth();
});

