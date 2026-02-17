// Gestion des publicités (côté admin) - réservé au SUPER_ADMIN

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadPublicites() {
  const tbody = document.getElementById('pub-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">Chargement...</td></tr>';

  try {
    const res = await fetchAPI('/publicites');
    const pubs = (res && res.data) || [];
    if (pubs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">Aucune publicité</td></tr>';
      return;
    }
    tbody.innerHTML = pubs
      .map((p) => {
        const description = (p.description || '').toString() || '—';
        const actif = p.actif ? 'Oui' : 'Non';
        return `
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 text-xs font-medium">${escapeHtml(p.titre)}</td>
            <td class="px-4 py-2 text-xs text-gray-700">${escapeHtml(description)}</td>
            <td class="px-4 py-2 text-xs">${actif}</td>
            <td class="px-4 py-2 text-xs">
              <button data-id="${p.id}" class="btn-delete text-red-600 hover:text-red-800 text-xs">Supprimer</button>
            </td>
          </tr>
        `;
      })
      .join('');
  } catch (err) {
    console.warn('Erreur chargement publicités:', err);
    tbody.innerHTML =
      '<tr><td colspan="4" class="px-4 py-4 text-center text-red-500">Erreur lors du chargement des publicités</td></tr>';
  }
}

async function deletePublicite(id) {
  if (!confirm('Supprimer cette publicité ?')) return;
  try {
    await fetchAPI(`/publicites/${id}`, { method: 'DELETE' });
    await loadPublicites();
  } catch (err) {
    alert(err.message || "Erreur lors de la suppression");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Vérifier le rôle : seul SUPER_ADMIN doit pouvoir voir cette page
  try {
    const raw = localStorage.getItem('user_info');
    const user = raw ? JSON.parse(raw) : null;
    const role = user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'super-admin') {
      // Si ce n'est pas un superadmin, on renvoie vers le dashboard de base
      window.location.href = '/admin';
      return;
    }
  } catch (e) {
    console.warn('Erreur lecture rôle superadmin:', e);
  }

  const form = document.getElementById('pub-form');
  const status = document.getElementById('pub-status');
  const btnRefresh = document.getElementById('btn-refresh');
  const tbody = document.getElementById('pub-table-body');

  loadPublicites();

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    status.textContent = 'Enregistrement en cours...';
    status.style.color = '#666';

    try {
      const formData = new FormData(form);

      const token = localStorage.getItem('jwt_token');
      if (!token) {
        window.location.href = '/admin/login.html';
        return;
      }

      const res = await fetch('/publicites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) {
        const msg = result.message || `Erreur HTTP ${res.status}`;
        throw new Error(msg);
      }

      status.textContent = result.message || 'Publicité enregistrée avec succès';
      status.style.color = '#0a7a0a';
      form.reset();
      document.getElementById('pub-image').value = '';
      await loadPublicites();
    } catch (err) {
      console.warn(err);
      status.textContent = err.message || "Erreur lors de l'enregistrement";
      status.style.color = '#b00020';
    }
  });

  btnRefresh?.addEventListener('click', (e) => {
    e.preventDefault();
    loadPublicites();
  });

  tbody?.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.classList.contains('btn-delete')) {
      const id = target.getAttribute('data-id');
      if (id) {
        deletePublicite(parseInt(id, 10));
      }
    }
  });
});

