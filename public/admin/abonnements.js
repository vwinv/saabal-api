// Uses fetchAPI from auth.js (loaded before this script)

// Load abonnements list
async function loadAbonnements() {
  const tbody = document.getElementById('abonnements-table-body');

  try {
    const result = await fetchAPI('/abonnements');
    const abonnements = result.data || [];

    if (abonnements.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-4 text-center text-gray-500">Aucun abonnement</td></tr>';
      return;
    }

    tbody.innerHTML = abonnements.map(abonnement => renderAbonnementRow(abonnement)).join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-4 text-center text-red-500">Erreur: ${err.message}</td></tr>`;
  }
}

// Render an abonnement row
function renderAbonnementRow(abonnement) {
  const user = abonnement.user || {};
  const userName = user.firstname || user.lastname 
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

  const prix = typeof abonnement.prix === 'object' && abonnement.prix !== null
    ? abonnement.prix.toString()
    : abonnement.prix;
  const prixFormatted = prix ? `${parseFloat(prix).toFixed(2)} FCFA` : '—';

  return `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-xs">${abonnement.id}</td>
      <td class="px-4 py-3 text-xs">${escapeHtml(userName)}</td>
      <td class="px-4 py-3 text-xs">${escapeHtml(userEmail)}</td>
      <td class="px-4 py-3 text-xs">
        <span class="px-2 py-1 text-[10px] rounded bg-gray-100 text-gray-800">${escapeHtml(abonnement.type || '—')}</span>
      </td>
      <td class="px-4 py-3 text-xs font-medium">${prixFormatted}</td>
      <td class="px-4 py-3 text-xs">${debutDate}</td>
      <td class="px-4 py-3 text-xs">${finDate}</td>
      <td class="px-4 py-3 text-xs">${statusBadge}</td>
    </tr>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
  loadAbonnements();
});

