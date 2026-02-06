// Uses fetchAPI from auth.js (loaded before this script)

// Load users and separate them into:
// - Admins (ADMIN / SUPER_ADMIN)
// - Clients (utilisateurs qui ont un abonnement)
async function loadUsers() {
  const adminsBody = document.getElementById('admins-table-body');
  const clientsBody = document.getElementById('clients-table-body');

  try {
    const usersResult = await fetchAPI('/users/all');
    const users = (usersResult && usersResult.data) || [];

    // Récupérer les abonnements pour identifier les clients abonnés
    const aboResult = await fetchAPI('/abonnements');
    const abonnements = (aboResult && aboResult.data) || [];
    const subscribedUserIds = new Set(abonnements.map((abo) => abo.userId));

    const isAdminRole = (role) =>
      role === 'ADMIN' ||
      role === 'admin' ||
      role === 'SUPER_ADMIN' ||
      role === 'super-admin';

    const admins = users.filter((user) => isAdminRole(user.role));
    const clients = users.filter(
      (user) => !isAdminRole(user.role) && subscribedUserIds.has(user.id),
    );

    // Render admins
    if (admins.length === 0) {
      adminsBody.innerHTML =
        '<tr><td colspan="8" class="px-4 py-4 text-center text-gray-500">Aucun administrateur</td></tr>';
    } else {
      adminsBody.innerHTML = admins.map((user) => renderUserRow(user)).join('');
    }

    // Render clients (uniquement ceux qui sont abonnés)
    if (clients.length === 0) {
      clientsBody.innerHTML =
        '<tr><td colspan="8" class="px-4 py-4 text-center text-gray-500">Aucun client abonné</td></tr>';
    } else {
      clientsBody.innerHTML = clients.map((user) => renderUserRow(user)).join('');
    }
  } catch (err) {
    console.error(err);
    const errorRow = `<tr><td colspan="8" class="px-4 py-4 text-center text-red-500">Erreur: ${err.message}</td></tr>`;
    adminsBody.innerHTML = errorRow;
    clientsBody.innerHTML = errorRow;
  }
}

// Render a user row
function renderUserRow(user) {
  const statusBadge = user.activated 
    ? '<span class="px-2 py-1 text-[10px] rounded bg-green-100 text-green-800">Actif</span>'
    : '<span class="px-2 py-1 text-[10px] rounded bg-red-100 text-red-800">Bloqué</span>';
  
  const createdDate = new Date(user.createdAt).toLocaleDateString('fr-FR');
  const blockButtonText = user.activated ? '🔒 Bloquer' : '🔓 Débloquer';
  const blockButtonClass = user.activated 
    ? 'text-orange-600 hover:text-orange-800' 
    : 'text-green-600 hover:text-green-800';

  return `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-xs">${user.id}</td>
      <td class="px-4 py-3 text-xs">${escapeHtml(user.email)}</td>
      <td class="px-4 py-3 text-xs">${escapeHtml(user.firstname || '—')}</td>
      <td class="px-4 py-3 text-xs">${escapeHtml(user.lastname || '—')}</td>
      <td class="px-4 py-3 text-xs">${escapeHtml(user.phone || '—')}</td>
      <td class="px-4 py-3 text-xs">${statusBadge}</td>
      <td class="px-4 py-3 text-xs">${createdDate}</td>
      <td class="px-4 py-3 text-xs">
        <div class="flex gap-2">
          <button onclick="editUser(${user.id})" class="btn-edit" title="Modifier">
            ✏️
          </button>
          <button onclick="resetPassword(${user.id}, '${escapeHtml(user.email)}')" class="text-blue-600 hover:text-blue-800" title="Réinitialiser le mot de passe">
            🔑
          </button>
          <button onclick="toggleBlockUser(${user.id}, '${escapeHtml(user.email)}', ${user.activated})" class="${blockButtonClass}" title="${user.activated ? 'Bloquer' : 'Débloquer'}">
            ${blockButtonText}
          </button>
        </div>
      </td>
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

// Edit user
async function editUser(id) {
  try {
    const result = await fetchAPI(`/users/${id}`);
    const user = (result && result.data) ? (result.data.user ?? result.data) : null;

    if (!user) {
      showStatus('Utilisateur introuvable', 'error');
      return;
    }

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-firstname').value = user.firstname || '';
    document.getElementById('edit-lastname').value = user.lastname || '';
    document.getElementById('edit-phone').value = user.phone || '';
    document.getElementById('edit-role').value = user.role || 'CLIENT';

    const modal = document.getElementById('edit-modal');
    modal.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    showStatus(`Erreur lors du chargement: ${err.message}`, 'error');
  }
}

// Reset password
async function resetPassword(id, email) {
  const newPassword = prompt(`Réinitialiser le mot de passe pour ${email}\n\nEntrez le nouveau mot de passe:`);
  
  if (!newPassword || newPassword.length < 6) {
    if (newPassword !== null) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
    }
    return;
  }

  if (!confirm(`Confirmer la réinitialisation du mot de passe pour ${email} ?`)) {
    return;
  }

  try {
    await fetchAPI('/users/updatePassword', {
      method: 'POST',
      body: JSON.stringify({
        id: id,
        password: newPassword,
      }),
    });
    alert('Mot de passe réinitialisé avec succès');
    await loadUsers();
  } catch (err) {
    console.error(err);
    alert(`Erreur lors de la réinitialisation: ${err.message}`);
  }
}

// Toggle block/unblock user
async function toggleBlockUser(id, email, isActivated) {
  const action = isActivated ? 'bloquer' : 'débloquer';
  if (!confirm(`Êtes-vous sûr de vouloir ${action} l'utilisateur "${email}" ?`)) {
    return;
  }

  try {
    await fetchAPI('/users/updateStatus', {
      method: 'POST',
      body: JSON.stringify({
        id: id,
        activated: !isActivated,
      }),
    });
    alert(`Utilisateur ${action} avec succès`);
    await loadUsers();
  } catch (err) {
    console.error(err);
    alert(`Erreur lors du ${action}: ${err.message}`);
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('edit-status');
  statusEl.textContent = message;
  statusEl.style.color = type === 'success' ? '#0a7a0a' : type === 'error' ? '#b00020' : '#666';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

// Modal handling
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();

  const modal = document.getElementById('edit-modal');
  const btnClose = document.getElementById('modal-close');
  const btnCancel = document.getElementById('modal-cancel');
  const form = document.getElementById('edit-user-form');

  function closeModal() {
    modal.classList.add('hidden');
    form.reset();
    document.getElementById('edit-status').textContent = '';
  }

  btnClose?.addEventListener('click', closeModal);
  btnCancel?.addEventListener('click', closeModal);

  // Close on overlay click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Form submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('edit-status');
    statusEl.textContent = 'Envoi en cours...';
    statusEl.style.color = '#666';

    const id = Number(document.getElementById('edit-user-id').value);
    const data = {
      id: id,
      email: document.getElementById('edit-email').value,
      firstname: document.getElementById('edit-firstname').value || undefined,
      lastname: document.getElementById('edit-lastname').value || undefined,
      phone: document.getElementById('edit-phone').value || undefined,
      role: document.getElementById('edit-role').value || undefined,
    };

    try {
      await fetchAPI('/users/update', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showStatus('Utilisateur modifié avec succès', 'success');
      setTimeout(() => {
        closeModal();
        loadUsers();
      }, 1500);
    } catch (err) {
      console.error(err);
      showStatus(`Erreur: ${err.message}`, 'error');
    }
  });
});

