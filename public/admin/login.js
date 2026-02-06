// Redirect if already logged in and handle login form
document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  const token = localStorage.getItem('jwt_token');
  const storedUserRaw = localStorage.getItem('user_info');
  const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  const storedRole = storedUser?.role;

  if (token) {
    // Si c'est un admin d'éditeur, aller directement sur la page Journaux
    if (storedRole === 'ADMIN' || storedRole === 'admin') {
      window.location.href = '/admin/journaux.html';
    } else {
      window.location.href = '/admin';
    }
    return;
  }

  // Login form submission
  const form = document.getElementById('login-form');
  const statusEl = document.getElementById('login-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Connexion en cours...';
    statusEl.style.color = '#666';

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Erreur de connexion' }));
        throw new Error(errorData.message || 'Email ou mot de passe incorrect');
      }

      const result = await res.json();
      // Format API : { success, data, message }
      if (result && result.success === false) {
        throw new Error(result.message || 'Email ou mot de passe incorrect');
      }

      // Store token in localStorage
      if (result.data && result.data.access_token) {
        localStorage.setItem('jwt_token', result.data.access_token);
        
        // Store refresh token if available
        if (result.data.refresh_token) {
          localStorage.setItem('jwt_refresh_token', result.data.refresh_token);
        }

        // Store user info
        if (result.data.user) {
          localStorage.setItem('user_info', JSON.stringify(result.data.user));
        }

        statusEl.textContent = 'Connexion réussie, redirection...';
        statusEl.style.color = '#0a7a0a';

        // Redirect selon le rôle
        setTimeout(() => {
          const user = result.data.user;
          const role = user?.role;
          if (role === 'ADMIN' || role === 'admin') {
            window.location.href = '/admin/journaux.html';
          } else {
            window.location.href = '/admin';
          }
        }, 500);
      } else {
        throw new Error('Token non reçu');
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = err.message || 'Erreur de connexion';
      statusEl.style.color = '#b00020';
    }
  });
});

