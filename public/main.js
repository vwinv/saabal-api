document.getElementById('year').textContent = new Date().getFullYear();

async function loadEditors(){
  try{
    const res = await fetch('/editors/public', { headers: { 'Accept': 'application/json' } });
    if(!res.ok) throw new Error('Failed to load editors');
    const data = await res.json();
    const list = document.getElementById('editors-list');
    list.innerHTML = '';
    
    const editors = data.data || [];
    
    if(editors.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-center col-span-full">Aucun éditeur disponible</p>';
      return;
    }
    
    // Afficher les éditeurs de la base de données
    editors.forEach(editor => {
      // Trouver le logo dans les documents
      const logoDoc = editor.documents?.find(doc => doc.kind === 'EDITEUR_LOGO');
      const logoUrl = logoDoc ? logoDoc.url : null;
      
      const item = document.createElement('div');
      item.className = 'editor-item';
      item.innerHTML = `
        <div class="editor-logo">
          ${logoUrl ? 
            `<img src="${logoUrl}" alt="${editor.nom}" style="width: 100%; height: 100%; object-fit: contain;" />` : 
            `<span>${editor.nom.charAt(0).toUpperCase()}</span>`
          }
        </div>
        <div class="editor-name">${editor.nom}</div>
      `;
      list.appendChild(item);
    });
    
    // Observer les nouveaux éléments éditeurs
    setTimeout(() => {
      const editorItems = document.querySelectorAll('.editor-item');
      editorItems.forEach(item => observer.observe(item));
    }, 50);
  }catch(e){
    console.warn('Erreur lors du chargement des éditeurs:', e);
    const list = document.getElementById('editors-list');
    list.innerHTML = '<p class="text-gray-500 text-center col-span-full">Erreur lors du chargement des éditeurs</p>';
  }
}

loadEditors();

// Chargement dynamique des offres depuis l'API /offres
async function loadOffres() {
  const container = document.querySelector('.pricing-grid');
  if (!container) return;

  try {
    const res = await fetch('/offres', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error('Erreur chargement offres');
    const body = await res.json();
    const offres = body.data || [];

    if (!offres.length) {
      container.innerHTML =
        '<p class="text-gray-500 text-center col-span-full">Aucune offre disponible pour le moment.</p>';
      return;
    }

    container.innerHTML = '';
    offres.forEach((offre, index) => {
      const p = offre.prix;
      const prix =
        typeof p === 'object' && p != null ? parseFloat(p.toString()) : parseFloat(p);
      const prixStr = Number.isNaN(prix) ? '—' : `${prix.toFixed(0)} FCFA`;

      const card = document.createElement('div');
      card.className =
        'price-card' + (index === 1 ? ' featured' : '');
      card.innerHTML = `
        <h3>${offre.nom}</h3>
        <p class="price">${prixStr}</p>
        ${offre.description ? `<p class="text-sm text-gray-600 mt-1">${offre.description}</p>` : ''}
      `;
      container.appendChild(card);
    });

    // Ajouter les nouvelles cartes au système d'animation
    const priceCards = document.querySelectorAll('.price-card');
    priceCards.forEach((card) => observer.observe(card));
  } catch (e) {
    console.warn('Erreur lors du chargement des offres:', e);
    container.innerHTML =
      '<p class="text-red-500 text-center col-span-full">Erreur lors du chargement des offres.</p>';
  }
}

loadOffres();

// Animation observer pour les éléments
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, observerOptions);

// Observer les cartes features
document.addEventListener('DOMContentLoaded', () => {
  // Observer les cartes features (déjà présentes)
  const featureCards = document.querySelectorAll('.features .card');
  featureCards.forEach(card => observer.observe(card));
  
  // Observer les éditeurs après leur création
  setTimeout(() => {
    const editorItems = document.querySelectorAll('.editor-item');
    editorItems.forEach(item => observer.observe(item));
  }, 100);
});


