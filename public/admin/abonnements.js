// Uses fetchAPI from auth.js (loaded before this script)

// Chargement de la liste des abonnements
async function loadAbonnements() {
  const tbody = document.getElementById('abonnements-table-body');

  try {
    const result = await fetchAPI('/abonnements');
    const abonnements = (result && result.data) || [];

    if (abonnements.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="px-4 py-4 text-center text-gray-500">Aucun abonnement</td></tr>';
      return;
    }

    tbody.innerHTML = abonnements.map((abonnement) => renderAbonnementRow(abonnement)).join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-4 text-center text-red-500">Erreur: ${escapeHtml(
      err.message || 'Erreur chargement',
    )}</td></tr>`;
  }
}

// Rendu d'une ligne d'abonnement
function renderAbonnementRow(abonnement) {
  const user = abonnement.user || {};
  const userName =
    user.firstname || user.lastname
      ? `${user.firstname || ''} ${user.lastname || ''}`.trim()
      : '—';
  const userEmail = user.email || '—';

  const debutDate = new Date(abonnement.debut).toLocaleDateString('fr-FR');
  const finDate = new Date(abonnement.fin).toLocaleDateString('fr-FR');

  const now = new Date();
  const fin = new Date(abonnement.fin);
  const isActive = fin >= now;
  const statusBadge = isActive
    ? '<span class="px-2 py-1 text-[10px] rounded bg-green-100 text-green-800">Actif</span>'
    : '<span class="px-2 py-1 text-[10px] rounded bg-red-100 text-red-800">Expiré</span>';

  const prix =
    typeof abonnement.prix === 'object' && abonnement.prix !== null
      ? abonnement.prix.toString()
      : abonnement.prix;
  const prixFormatted = prix ? `${parseFloat(prix).toFixed(2)} FCFA` : '—';

  return `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-xs">${abonnement.id}</td>
      <td class="px-4 py-3 text-xs">${escapeHtml(userName)}</td>
      <td class="px-4 py-3 text-xs">${escapeHtml(userEmail)}</td>
      <td class="px-4 py-3 text-xs">
        <span class="px-2 py-1 text-[10px] rounded bg-gray-100 text-gray-800">${escapeHtml(
          abonnement.offre ? abonnement.offre.nom : '—',
        )}</span>
      </td>
      <td class="px-4 py-3 text-xs font-medium">${prixFormatted}</td>
      <td class="px-4 py-3 text-xs">${debutDate}</td>
      <td class="px-4 py-3 text-xs">${finDate}</td>
      <td class="px-4 py-3 text-xs">${statusBadge}</td>
    </tr>
  `;
}

// Chargement de la liste des offres (table en bas de page)
async function loadOffres() {
  const tbody = document.getElementById('offres-table-body');
  if (!tbody) return;

  try {
    const result = await fetchAPI('/offres');
    const offres = (result && result.data) || [];

    if (offres.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="px-4 py-4 text-center text-gray-500">Aucune offre</td></tr>';
      return;
    }

    tbody.innerHTML = offres
      .map((o) => {
        const p = o.prix;
        const prix =
          typeof p === 'object' && p != null ? parseFloat(p.toString()) : parseFloat(p);
        const prixStr = Number.isNaN(prix) ? '—' : `${prix.toFixed(2)} FCFA`;
        const desc = (o.description || '').trim() || '—';
        return `
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-xs font-medium">${escapeHtml(o.nom)}</td>
            <td class="px-4 py-3 text-xs">${prixStr}</td>
            <td class="px-4 py-3 text-xs text-gray-600">${escapeHtml(desc)}</td>
          </tr>
        `;
      })
      .join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="3" class="px-4 py-4 text-center text-red-500">Erreur: ${escapeHtml(
      err.message || 'Erreur chargement',
    )}</td></tr>`;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Gestion du formulaire de création d'offre
function initOffreForm() {
  const btnAdd = document.getElementById('btn-add-offre');
  const container = document.getElementById('offre-form-container');
  const form = document.getElementById('offre-form');
  const btnCancel = document.getElementById('offre-form-cancel');
  const status = document.getElementById('offre-status');

  if (!btnAdd || !container || !form) return;

  function showForm() {
    container.classList.remove('hidden');
    status.textContent = '';
  }

  function hideForm() {
    container.classList.add('hidden');
    form.reset();
    status.textContent = '';
  }

  btnAdd.addEventListener('click', (e) => {
    e.preventDefault();
    if (container.classList.contains('hidden')) {
      showForm();
    } else {
      hideForm();
    }
  });

  btnCancel?.addEventListener('click', (e) => {
    e.preventDefault();
    hideForm();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Enregistrement en cours...';
    status.classList.remove('text-red-600', 'text-green-600');
    status.classList.add('text-gray-600');

    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());

    try {
      const res = await fetchAPI('/offres', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      status.textContent = res.message || 'Offre créée avec succès';
      status.classList.remove('text-gray-600');
      status.classList.add('text-green-600');

      // Recharger la liste des offres
      await loadOffres();

      // Cacher le formulaire après un court délai
      setTimeout(() => {
        hideForm();
      }, 800);
    } catch (err) {
      console.error(err);
      status.textContent = err.message || "Échec de l'enregistrement";
      status.classList.remove('text-gray-600');
      status.classList.add('text-red-600');
    }
  });
}

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
  loadAbonnements();
  loadOffres();
  initOffreForm();
});
