// Uses fetchAPI from auth.js (loaded before this script)

let editingId = null;

// Load editors and categories for dropdowns
async function loadSelects() {
  try {
    // Load editors
    const editorsRes = await fetchAPI('/editors');
    const editors = editorsRes.data || [];
    const editeurSelect = document.getElementById('journal-editeur');
    // Clear existing options except the first one
    while (editeurSelect.children.length > 1) {
      editeurSelect.removeChild(editeurSelect.lastChild);
    }
    editors.forEach(editor => {
      const option = document.createElement('option');
      option.value = editor.id;
      option.textContent = editor.nom;
      editeurSelect.appendChild(option);
    });

    // Load categories for dropdown
    await loadCategoriesForSelect();
  } catch (err) {
    console.error('Erreur lors du chargement des sélecteurs:', err);
  }
}

// Load categories for dropdown select
async function loadCategoriesForSelect() {
  try {
    const categoriesRes = await fetchAPI('/api/categories');
    const categories = categoriesRes.data || [];
    const categorieSelect = document.getElementById('journal-categorie');
    // Clear existing options except the first one
    while (categorieSelect.children.length > 1) {
      categorieSelect.removeChild(categorieSelect.lastChild);
    }
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorieSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Erreur lors du chargement des catégories:', err);
  }
}

// Load categories list for display
async function loadCategories() {
  const listEl = document.getElementById('categories-list');
  try {
    const result = await fetchAPI('/api/categories');
    const categories = result.data || [];

    if (categories.length === 0) {
      listEl.innerHTML = '<p class="text-gray-500 text-sm">Aucune catégorie pour le moment.</p>';
      return;
    }

    listEl.innerHTML = categories
      .map(
        (category) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition">
          <div>
            <p class="text-sm font-medium">${escapeHtml(category.name)}</p>
            <p class="text-[11px] text-gray-500">Créée le ${new Date(category.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      `
      )
      .join('');
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p class="text-red-500 text-sm">Erreur lors du chargement: ${err.message}</p>`;
  }
}

// Load journals list
async function loadJournals() {
  const listEl = document.getElementById('journals-list');
  try {
    const result = await fetchAPI('/newsletters');
    const journals = result.data || [];

    if (journals.length === 0) {
      listEl.innerHTML = '<p class="text-gray-500 text-sm">Aucun journal pour le moment.</p>';
      return;
    }

    listEl.innerHTML = journals
      .map(
        (journal) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition">
          <div class="flex-1">
            <p class="text-sm font-medium">${escapeHtml(journal.title)}</p>
            <p class="text-[11px] text-gray-500">
              ${journal.editeur ? `Éditeur: ${escapeHtml(journal.editeur.nom)}` : 'Éditeur inconnu'} • 
              ${journal.categorie ? `Catégorie: ${escapeHtml(journal.categorie.name)}` : 'Catégorie inconnue'} • 
              Créé le ${new Date(journal.createdAt).toLocaleDateString('fr-FR')}
            </p>
            ${journal.content ? `<p class="text-[11px] text-gray-600 mt-1 line-clamp-2">${escapeHtml(journal.content.substring(0, 100))}${journal.content.length > 100 ? '...' : ''}</p>` : ''}
          </div>
          <div class="flex gap-2 ml-4">
            <button onclick="editJournal(${journal.id})" class="btn-edit" title="Modifier">
              ✏️
            </button>
            <button onclick="deleteJournal(${journal.id}, '${escapeHtml(journal.title)}')" class="btn-delete" title="Supprimer">
              🗑️
            </button>
          </div>
        </div>
      `
      )
      .join('');
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p class="text-red-500 text-sm">Erreur lors du chargement: ${err.message}</p>`;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Edit journal
async function editJournal(id) {
  try {
    const result = await fetchAPI('/newsletters');
    const journals = result.data || [];
    const journal = journals.find(j => j.id === id);
    
    if (!journal) {
      showStatus('Journal introuvable', 'error');
      return;
    }

    editingId = id;
    document.getElementById('journal-title').value = journal.title || '';
    document.getElementById('journal-content').value = journal.content || '';
    document.getElementById('journal-editeur').value = journal.editeurId || '';
    document.getElementById('journal-categorie').value = journal.categorieId || '';
    
    if (journal.dateJournal) {
      const date = new Date(journal.dateJournal);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      document.getElementById('journal-date').value = localDate.toISOString().slice(0, 10);
    }

    document.getElementById('form-title').textContent = 'Modifier un journal';
    document.getElementById('submit-btn').textContent = 'Modifier';
    document.getElementById('cancel-btn').classList.remove('hidden');
    
    // Scroll to form
    document.getElementById('journal-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error(err);
    showStatus(`Erreur lors du chargement: ${err.message}`, 'error');
  }
}

// Cancel edit
function cancelEdit() {
  editingId = null;
  document.getElementById('journal-form').reset();
  document.getElementById('form-title').textContent = 'Ajouter un journal';
  document.getElementById('submit-btn').textContent = 'Enregistrer';
  document.getElementById('cancel-btn').classList.add('hidden');
  document.getElementById('journal-status').textContent = '';
}

// Delete journal
async function deleteJournal(id, title) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le journal "${title}" ?`)) {
    return;
  }

  try {
    await fetchAPI(`/newsletters/${id}`, { method: 'DELETE' });
    await loadJournals();
    showStatus('Journal supprimé avec succès', 'success');
  } catch (err) {
    console.error(err);
    showStatus(`Erreur lors de la suppression: ${err.message}`, 'error');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('journal-status');
  statusEl.textContent = message;
  statusEl.style.color = type === 'success' ? '#0a7a0a' : type === 'error' ? '#b00020' : '#666';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

// Category form submission
function handleCategorySubmit(e) {
  e.preventDefault();
  const statusEl = document.getElementById('category-status');
  statusEl.textContent = 'Envoi en cours...';
  statusEl.style.color = '#666';

  const formData = new FormData(e.target);
  const data = {
    name: formData.get('name').trim(),
  };

  fetchAPI('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
    .then(() => {
      showCategoryStatus('Catégorie créée avec succès', 'success');
      e.target.reset();
      loadCategories();
      loadCategoriesForSelect();
    })
    .catch((err) => {
      console.error(err);
      showCategoryStatus(`Erreur: ${err.message}`, 'error');
    });
}

// Show category status message
function showCategoryStatus(message, type = 'info') {
  const statusEl = document.getElementById('category-status');
  statusEl.textContent = message;
  statusEl.style.color = type === 'success' ? '#0a7a0a' : type === 'error' ? '#b00020' : '#666';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

// Form submission
document.addEventListener('DOMContentLoaded', () => {
  loadSelects();
  loadJournals();
  loadCategories();

  const form = document.getElementById('journal-form');
  const cancelBtn = document.getElementById('cancel-btn');
  const categoryForm = document.getElementById('category-form');

  cancelBtn.addEventListener('click', cancelEdit);
  categoryForm.addEventListener('submit', handleCategorySubmit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('journal-status');
    statusEl.textContent = 'Envoi en cours...';
    statusEl.style.color = '#666';

    try {
      const formData = new FormData(form);
      const data = {
        title: formData.get('title'),
        content: formData.get('content') || undefined,
        filename: 'document.pdf', // Valeur par défaut
        mime: 'application/pdf', // Valeur par défaut
        size: 0, // Valeur par défaut
        editeurId: Number(formData.get('editeurId')),
        categorieId: Number(formData.get('categorieId')),
        dateJournal: formData.get('dateJournal') ? new Date(formData.get('dateJournal') + 'T00:00:00').toISOString() : undefined,
      };

      if (editingId) {
        // Update
        await fetchAPI(`/newsletters/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        showStatus('Journal modifié avec succès', 'success');
        cancelEdit();
      } else {
        // Create
        await fetchAPI('/newsletters', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        showStatus('Journal créé avec succès', 'success');
        form.reset();
      }
      await loadJournals();
    } catch (err) {
      console.error(err);
      showStatus(`Erreur: ${err.message}`, 'error');
    }
  });
});

