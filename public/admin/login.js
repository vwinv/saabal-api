// Redirect if already logged in and handle login form
document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  const token = localStorage.getItem('jwt_token');
  if (token) {
    window.location.href = '/admin';
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

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/admin';
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

