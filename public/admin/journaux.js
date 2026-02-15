// Uses fetchAPI from auth.js (loaded before this script)

let editingId = null;

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user_info');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Load editors and categories for dropdowns
async function loadSelects() {
  try {
    const user = getCurrentUser();
    const role = user?.role;
    const editeurSelect = document.getElementById('journal-editeur');

    // Si SUPER_ADMIN : on charge tous les éditeurs dans la liste
    if (role === 'SUPER_ADMIN' || role === 'super-admin') {
      const editorsRes = await fetchAPI('/editors');
      const editors = (editorsRes && editorsRes.data) || [];
      // Clear existing options except the first one
      while (editeurSelect.children.length > 1) {
        editeurSelect.removeChild(editeurSelect.lastChild);
      }
      editors.forEach((editor) => {
        const option = document.createElement('option');
        option.value = editor.id;
        option.textContent = editor.nom;
        editeurSelect.appendChild(option);
      });
    } else {
      // ADMIN : il ne voit que son propre éditeur et ne peut pas le changer
      const editeurId = user?.editeurId;
      if (!editeurId) {
        console.error('Aucun éditeur associé à cet administrateur');
      } else {
        const editorsRes = await fetchAPI('/editors');
        const editors = editorsRes.data || [];
        const editor = editors.find((e) => e.id === editeurId);

        // On nettoie et on ajoute une seule option (désactivée)
        while (editeurSelect.firstChild) {
          editeurSelect.removeChild(editeurSelect.firstChild);
        }
        const option = document.createElement('option');
        option.value = editeurId;
        option.textContent = editor ? editor.nom : `Éditeur #${editeurId}`;
        editeurSelect.appendChild(option);
        editeurSelect.disabled = true;
      }
    }

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
    const categories = (categoriesRes && categoriesRes.data) || [];
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
    const categories = (result && result.data) || [];

    if (categories.length === 0) {
      listEl.innerHTML = '<p class="text-gray-500 text-sm">Aucune catégorie pour le moment.</p>';
      return;
    }

    listEl.innerHTML = categories
      .map(
        (category) => `
        <div class="flex items-center justify-between span-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition px-3 py-2">
          <div>
            <span class="text-sm font-medium">${escapeHtml(category.name)}</span>
            <span class="block text-[11px] text-gray-500">Créée le ${new Date(category.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
          <button
            class="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            onclick="deleteCategory(${category.id}, '${escapeHtml(category.name)}')"
            title="Supprimer la catégorie"
          >
            Supprimer
          </button>
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
    const journals = (result && result.data) || [];

    if (journals.length === 0) {
      listEl.innerHTML = '<p class="text-gray-500 text-sm">Aucun journal pour le moment.</p>';
      return;
    }

    listEl.innerHTML = journals
      .map(
        (journal) => `
        <div class="flex items-center justify-between span-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition p-2">
          <div class="flex-1">
            <span class="text-sm font-medium">${escapeHtml(journal.title)}</span>
            <span class="text-[11px] text-gray-500">
              ${journal.editeur ? `Éditeur: ${escapeHtml(journal.editeur.nom)}` : 'Éditeur inconnu'} • 
              ${journal.categorie ? `Catégorie: ${escapeHtml(journal.categorie.name)}` : 'Catégorie inconnue'} • 
              Créé le ${new Date(journal.dateJournal).toLocaleDateString('fr-FR')}
            
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
    const journals = (result && result.data) || [];
    const journal = journals.find(j => j.id === id);

    if (!journal) {
      showStatus('Journal introuvable', 'error');
      return;
    }

    editingId = id;
    document.getElementById('journal-title').value = journal.title || '';
    const grosTitreEl = document.getElementById('journal-gros-titre');
    if (grosTitreEl) {
      grosTitreEl.value = journal.grosTitre || '';
    }
    const pdfInput = document.getElementById('journal-pdf');
    if (pdfInput) pdfInput.value = '';
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

// Delete category (SUPER_ADMIN uniquement via l'API protégée)
async function deleteCategory(id, name) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${name}" ?`)) {
    return;
  }

  const statusEl = document.getElementById('category-status');
  if (statusEl) {
    statusEl.textContent = 'Suppression en cours...';
    statusEl.style.color = '#666';
  }

  try {
    await fetchAPI(`/api/categories/${id}`, { method: 'DELETE' });
    await loadCategories();
    await loadCategoriesForSelect();
    showCategoryStatus('Catégorie supprimée avec succès', 'success');
  } catch (err) {
    console.error(err);
    showCategoryStatus(err.message || 'Erreur lors de la suppression', 'error');
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
    .then((result) => {
      showCategoryStatus(result.message || 'Catégorie créée avec succès', 'success');
      e.target.reset();
      loadCategories();
      loadCategoriesForSelect();
    })
    .catch((err) => {
      console.error(err);
      showCategoryStatus(err.message || 'Erreur', 'error');
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
  // Adapter l'interface pour les ADMIN : pas de barre latérale, uniquement Journaux
  // Pour SUPER_ADMIN, rien ne change (barre latérale visible)
  try {
    const user = getCurrentUser();
    const role = user?.role;
    if (role === 'ADMIN' || role === 'admin') {
      // Afficher la barre rouge en haut avec le nom de l'éditeur
      const topBar = document.getElementById('admin-top-bar');
      const editorNameDisplay = document.getElementById('editor-name-display');

      if (topBar) {
        topBar.classList.remove('hidden');
      }

      // Charger le nom de l'éditeur
      const editeurId = user?.editeurId;
      if (editeurId && editorNameDisplay) {
        fetchAPI('/editors')
          .then((result) => {
            const editors = (result && result.data) || [];
            const editor = editors.find((e) => e.id === editeurId);
            if (editor && editorNameDisplay) {
              editorNameDisplay.textContent = editor.nom;
            }
          })
          .catch((err) => {
            console.error('Erreur chargement éditeur:', err);
            if (editorNameDisplay) {
              editorNameDisplay.textContent = 'Éditeur';
            }
          });
      }

      // Gérer le menu profil (toggle)
      const profileMenuBtn = document.getElementById('profile-menu-btn');
      const profileMenu = document.getElementById('profile-menu');

      if (profileMenuBtn && profileMenu) {
        profileMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          profileMenu.classList.toggle('hidden');
        });

        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', (e) => {
          if (!profileMenuBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.add('hidden');
          }
        });
      }

      // Cacher la barre latérale (aside)
      const sidebar = document.querySelector('aside');
      // Le layout est le div qui contient aside et main (celui avec grid)
      const layout = document.querySelector('body > div.min-h-screen.grid');
      const backLink = document.querySelector('header a[href="/admin"]');
      // Cacher le formulaire de création de catégorie (réservé aux SUPER_ADMIN)
      const categoryFormSection = document.getElementById('category-form-section');
      // Cacher la liste des catégories (ADMIN n'en a pas besoin)
      const categoriesListSection = document.getElementById('categories-list-section');
      // Cacher toute la section catégories si elle existe
      const categoriesSection = document.querySelector('section.mb-6');

      if (sidebar) {
        sidebar.style.display = 'none';
      }
      if (layout) {
        layout.classList.remove('grid', 'grid-cols-[240px_1fr]');
      }
      if (backLink && backLink.parentElement) {
        backLink.parentElement.style.display = 'none';
      }
      if (categoryFormSection) {
        categoryFormSection.style.display = 'none';
      }
      if (categoriesListSection) {
        categoriesListSection.style.display = 'none';
      }
      // Si toute la section catégories est vide (formulaire + liste cachés), on cache la section entière
      if (categoriesSection && categoryFormSection && categoriesListSection) {
        const hasVisibleChildren = Array.from(categoriesSection.querySelectorAll('section.card')).some(
          (card) => card.style.display !== 'none'
        );
        if (!hasVisibleChildren) {
          categoriesSection.style.display = 'none';
        }
      }
    }
    // Pour SUPER_ADMIN, on ne fait rien - la barre latérale reste visible par défaut
  } catch (e) {
    console.error('Erreur adaptation interface admin journaux :', e);
  }

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
    const pdfInput = document.getElementById('journal-pdf');
    const hasPdf = pdfInput && pdfInput.files && pdfInput.files.length > 0;

    if (!editingId && !hasPdf) {
      showStatus('Veuillez sélectionner un fichier PDF.', 'error');
      return;
    }

    statusEl.textContent = 'Envoi en cours...';
    statusEl.style.color = '#666';

    try {
      const formData = new FormData(form);
      const token = getToken();
      if (!token) {
        requireAuth();
        throw new Error('Token JWT requis');
      }

      const url = editingId ? `/newsletters/${editingId}` : '/newsletters';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Erreur HTTP ${res.status}`);
      }

      const body = await res.json();
      if (body && body.success === false) {
        throw new Error(body.message || 'Erreur serveur');
      }

      showStatus(editingId ? 'Journal modifié avec succès' : 'Journal créé avec succès', 'success');
      cancelEdit();
      form.reset();
      await loadJournals();
    } catch (err) {
      console.error(err);
      showStatus(`Erreur: ${err.message}`, 'error');
    }
  });
});

