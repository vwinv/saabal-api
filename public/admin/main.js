// Uses fetchAPI from auth.js (loaded before this script)

async function loadStats(){
  try{
    // Load users count
    try {
      const usersRes = await fetchAPI('/users/all');
      const users = usersRes.data || [];
      document.getElementById('stat-users').textContent = users.length;
    } catch (err) {
      console.warn('Erreur chargement utilisateurs:', err);
      document.getElementById('stat-users').textContent = '—';
    }

    // Load abonnements total amount
    try {
      const abonnementsRes = await fetchAPI('/abonnements');
      const abonnements = abonnementsRes.data || [];
      const totalAmount = abonnements.reduce((sum, abo) => {
        const prix = parseFloat(abo.prix) || 0;
        return sum + prix;
      }, 0);
      document.getElementById('stat-subs').textContent = totalAmount.toFixed(2) + ' FCFA';
    } catch (err) {
      console.warn('Erreur chargement abonnements:', err);
      document.getElementById('stat-subs').textContent = '—';
    }

    // Load journals count
    try {
      const journalsRes = await fetchAPI('/newsletters');
      const journals = journalsRes.data || [];
      document.getElementById('stat-news').textContent = journals.length;
    } catch (err) {
      console.warn('Erreur chargement journaux:', err);
      document.getElementById('stat-news').textContent = '—';
    }

    // Load most popular subscription type
    try {
      const popularTypeRes = await fetchAPI('/abonnements/stats/most-popular-type');
      const popularType = popularTypeRes.data || {};
      document.getElementById('stat-popular-type').textContent = popularType.type ? `${popularType.type} (${popularType.count})` : '—';
    } catch (err) {
      console.warn('Erreur chargement type populaire:', err);
      document.getElementById('stat-popular-type').textContent = '—';
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
      const usersStats = usersStatsRes.data || [];
      
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
      const subsStats = subsStatsRes.data || [];
      
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
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const result = await res.json().catch(() => ({}));
      status.textContent = 'Catégorie créée avec succès';
      status.style.color = '#0a7a0a';
      
      // Refresh category list or update input with new ID if needed
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      console.warn(err);
      status.textContent = "Échec de l'enregistrement (API à implémenter)";
      status.style.color = '#b00020';
    }
  });
});

