// Uses fetchAPI from auth.js (loaded before this script)

let editingId = null;

// Load editors list
async function loadEditors() {
  const listEl = document.getElementById('editors-list');
  try {
    const result = await fetchAPI('/editors');
    const editors = (result && result.data) || [];

    if (editors.length === 0) {
      listEl.innerHTML = '<p class="text-gray-500 text-sm">Aucun éditeur pour le moment.</p>';
      return;
    }

    listEl.innerHTML = editors
      .map(
        (editor) => {
          const logo = editor.documents && editor.documents.length > 0 
            ? editor.documents.find(doc => doc.kind === 'EDITEUR_LOGO') 
            : null;
          const logoUrl = logo ? logo.url : null;
          
          return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition">
          <div class="flex items-center gap-3">
            ${logoUrl ? `<img src="${logoUrl}" alt="${escapeHtml(editor.nom)}" class="w-12 h-12 object-contain rounded bg-white p-1 border border-gray-200" />` : '<div class="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-[11px]">Pas de logo</div>'}
            <div>
              <p class="text-sm font-medium">${escapeHtml(editor.nom)}</p>
              <p class="text-[11px] text-gray-500">ID: ${editor.id} • Créé le ${new Date(editor.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="editEditor(${editor.id}, '${escapeHtml(editor.nom)}')" class="btn-edit" title="Modifier">
              ✏️
            </button>
            <button onclick="deleteEditor(${editor.id}, '${escapeHtml(editor.nom)}')" class="btn-delete" title="Supprimer">
              🗑️
            </button>
          </div>
        </div>
      `;
        }
      )
      .join('');
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p class="text-red-500 text-sm">Erreur lors du chargement: ${err.message}</p>`;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Edit editor
function editEditor(id, nom) {
  editingId = id;
  document.getElementById('editor-nom').value = nom;
  document.getElementById('form-title').textContent = 'Modifier un éditeur';
  document.getElementById('submit-btn').textContent = 'Modifier';
  document.getElementById('cancel-btn').classList.remove('hidden');
}

// Cancel edit
function cancelEdit() {
  editingId = null;
  document.getElementById('editor-form').reset();
  document.getElementById('form-title').textContent = 'Ajouter un éditeur';
  document.getElementById('submit-btn').textContent = 'Enregistrer';
  document.getElementById('cancel-btn').classList.add('hidden');
  document.getElementById('editor-status').textContent = '';
}

// Delete editor
async function deleteEditor(id, nom) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'éditeur "${nom}" ?\n\nCette action supprimera également l'administrateur lié et le logo associé.`)) {
    return;
  }

  try {
    await fetchAPI(`/editors/${id}`, { method: 'DELETE' });
    await loadEditors();
    showStatus('Éditeur, admin associé et logo supprimés avec succès', 'success');
  } catch (err) {
    console.error(err);
    showStatus(`Erreur lors de la suppression: ${err.message}`, 'error');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('editor-status');
  statusEl.textContent = message;
  statusEl.style.color = type === 'success' ? '#0a7a0a' : type === 'error' ? '#b00020' : '#666';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

// Form submission
document.addEventListener('DOMContentLoaded', () => {
  loadEditors();

  const form = document.getElementById('editor-form');
  const cancelBtn = document.getElementById('cancel-btn');

  cancelBtn.addEventListener('click', cancelEdit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('editor-status');
    statusEl.textContent = 'Envoi en cours...';
    statusEl.style.color = '#666';

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      window.location.href = '/admin/login.html';
      return;
    }

    try {
      if (editingId) {
        // Update (sans fichier pour l'instant)
        const data = { nom: document.getElementById('editor-nom').value };
        await fetchAPI(`/editors/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        showStatus('Éditeur modifié avec succès', 'success');
        cancelEdit();
      } else {
        // Create avec FormData pour supporter le fichier
        const formData = new FormData(form);
        
        const res = await fetch('/editors', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('jwt_token');
            window.location.href = '/admin/login.html';
            throw new Error('Session expirée');
          }
          throw new Error(result.message || `HTTP ${res.status}`);
        }
        if (result.success === false) throw new Error(result.message || 'Erreur serveur');

        const statusEl = document.getElementById('editor-status');
        statusEl.textContent = result.message || 'Éditeur créé avec succès.';
        statusEl.style.color = '#0a7a0a';

        form.reset();
      }
      await loadEditors();
    } catch (err) {
      console.error(err);
      showStatus(`Erreur: ${err.message}`, 'error');
    }
  });
});

