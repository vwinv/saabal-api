// Uses fetchAPI from auth.js (loaded before this script)

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadStats(){
  try{
    // Load users count
    try {
      const usersRes = await fetchAPI('/users/all');
      const users = (usersRes && usersRes.data) || [];
      document.getElementById('stat-users').textContent = users.length;
    } catch (err) {
      console.warn('Erreur chargement utilisateurs:', err);
      document.getElementById('stat-users').textContent = '—';
    }

    // Load abonnements total amount
    try {
      const abonnementsRes = await fetchAPI('/abonnements');
      const abonnements = (abonnementsRes && abonnementsRes.data) || [];
      const totalAmount = abonnements.reduce((sum, abo) => {
        const p = abo.prix;
        const prix = typeof p === 'object' && p != null ? parseFloat(p.toString()) : parseFloat(p);
        return sum + (Number.isNaN(prix) ? 0 : prix);
      }, 0);
      document.getElementById('stat-subs').textContent = totalAmount.toFixed(2) + ' FCFA';
    } catch (err) {
      console.warn('Erreur chargement abonnements:', err);
      document.getElementById('stat-subs').textContent = '—';
    }

    // Load journals count
    try {
      const journalsRes = await fetchAPI('/newsletters');
      const journals = (journalsRes && journalsRes.data) || [];
      document.getElementById('stat-news').textContent = journals.length;
    } catch (err) {
      console.warn('Erreur chargement journaux:', err);
      document.getElementById('stat-news').textContent = '—';
    }

    // Load most popular offre
    try {
      const popularOffreRes = await fetchAPI('/abonnements/stats/most-popular-offre');
      const popularOffre = (popularOffreRes && popularOffreRes.data) || {};
      const offreName = popularOffre.offre ? popularOffre.offre.nom : null;
      document.getElementById('stat-popular-offre').textContent = offreName ? `${offreName} (${popularOffre.count})` : '—';
    } catch (err) {
      console.warn('Erreur chargement offre populaire:', err);
      document.getElementById('stat-popular-offre').textContent = '—';
    }

    // Load offres list (table Offre)
    try {
      const offresRes = await fetchAPI('/offres');
      const offres = (offresRes && offresRes.data) || [];
      const tbody = document.getElementById('offres-table-body');
      if (tbody) {
        if (offres.length === 0) {
          tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-gray-500">Aucune offre</td></tr>';
        } else {
          tbody.innerHTML = offres.map(o => {
            const prix = typeof o.prix === 'object' && o.prix != null ? o.prix.toString() : o.prix;
            const prixStr = prix ? parseFloat(prix).toFixed(2) + ' FCFA' : '—';
            const desc = (o.description || '').trim() || '—';
            return `<tr class="hover:bg-gray-50"><td class="px-4 py-3 text-xs font-medium">${escapeHtml(o.nom)}</td><td class="px-4 py-3 text-xs">${prixStr}</td><td class="px-4 py-3 text-xs text-gray-600">${escapeHtml(desc)}</td></tr>`;
          }).join('');
        }
      }
    } catch (err) {
      console.warn('Erreur chargement offres:', err);
      const tbody = document.getElementById('offres-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-red-500">Erreur chargement</td></tr>';
    }
  }catch(e){
    console.warn(e);
  }
}

let usersChart = null;
let subscriptionsChart = null;

async function loadCharts() {
  try {
    // Load users by month
    try {
      const usersStatsRes = await fetchAPI('/users/stats/by-month');
      const usersStats = (usersStatsRes && usersStatsRes.data) || [];
      
      const ctxUsers = document.getElementById('users-chart');
      if (ctxUsers && usersChart) {
        usersChart.destroy();
      }
      
      if (ctxUsers) {
        usersChart = new Chart(ctxUsers, {
          type: 'line',
          data: {
            labels: usersStats.map(item => item.month),
            datasets: [{
              label: 'Nombre d\'utilisateurs',
              data: usersStats.map(item => item.count),
              borderColor: '#E10600',
              backgroundColor: 'rgba(225, 6, 0, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.warn('Erreur chargement stats utilisateurs:', err);
    }

    // Load subscriptions by month
    try {
      const subsStatsRes = await fetchAPI('/abonnements/stats/by-month');
      const subsStats = (subsStatsRes && subsStatsRes.data) || [];
      
      const ctxSubs = document.getElementById('subscriptions-chart');
      if (ctxSubs && subscriptionsChart) {
        subscriptionsChart.destroy();
      }
      
      if (ctxSubs) {
        subscriptionsChart = new Chart(ctxSubs, {
          type: 'bar',
          data: {
            labels: subsStats.map(item => item.month),
            datasets: [{
              label: 'Montant (FCFA)',
              data: subsStats.map(item => item.amount),
              backgroundColor: '#E10600',
              borderColor: '#E10600',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' FCFA';
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value.toFixed(0) + ' FCFA';
                  }
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.warn('Erreur chargement stats abonnements:', err);
    }
  } catch (e) {
    console.warn('Erreur chargement graphiques:', e);
  }
}

// Load stats when page loads (after auth.js is loaded)
document.addEventListener('DOMContentLoaded', () => {
  // Adapter le menu en fonction du rôle
  try {
    const raw = localStorage.getItem('user_info');
    const user = raw ? JSON.parse(raw) : null;
    const role = user?.role;

    if (role === 'ADMIN' || role === 'admin') {
      const links = document.querySelectorAll('aside nav a');
      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (!href.includes('/admin/journaux.html')) {
          link.style.display = 'none';
        }
      });
    }
  } catch (e) {
    console.warn('Erreur lors de la lecture du rôle utilisateur :', e);
  }

  loadStats();
  // Wait a bit for Chart.js to be loaded
  setTimeout(() => {
    loadCharts();
  }, 500);
});

// Category modal handling
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('category-modal');
  const btnOpen = document.getElementById('btn-add-category');
  const btnClose = document.getElementById('modal-close');
  const btnCancel = document.getElementById('modal-cancel');
  const form = document.getElementById('category-form');
  const status = document.getElementById('category-status');

  function openModal() {
    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
    form.reset();
    status.textContent = '';
  }

  btnOpen?.addEventListener('click', openModal);
  btnClose?.addEventListener('click', closeModal);
  btnCancel?.addEventListener('click', closeModal);
  
  // Close on overlay click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Envoi en cours...';
    status.style.color = '#666';
    
    const data = Object.fromEntries(new FormData(form).entries());
    
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        window.location.href = '/admin/login.html';
        return;
      }
      
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'HTTP ' + res.status);
      if (result.success === false) throw new Error(result.message || 'Erreur serveur');
      status.textContent = result.message || 'Catégorie créée avec succès';
      status.style.color = '#0a7a0a';
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      console.warn(err);
      status.textContent = err.message || "Échec de l'enregistrement";
      status.style.color = '#b00020';
    }
  });
});

