/* Menus déroulants du haut : au toucher sur téléphone, Échap ou un clic ailleurs pour fermer. */
(function () {
  var items = document.querySelectorAll('.nv');
  if (!items.length) return;
  function closeAll(except) {
    items.forEach(function (n) {
      if (n !== except) { n.classList.remove('open'); n.querySelector('.nv-b').setAttribute('aria-expanded', 'false'); }
    });
  }
  items.forEach(function (n) {
    var b = n.querySelector('.nv-b');
    b.addEventListener('click', function (e) {
      var o = !n.classList.contains('open');
      closeAll(n);
      n.classList.toggle('open', o);
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
      e.stopPropagation();
    });
  });
  document.addEventListener('click', function () { closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
})();

/* Liens du menu Agence : ces cibles sont appliquées ici pour que les pages produits (Book, Stay, Insight, Studio)
   restent intactes tout en pointant vers la page /agence et les bonnes sections. */
(function () {
  var map = {
    'Référencement': '/agence#specialises',
    'Sites web et design': '/agence#specialises',
    'CRM sur mesure': '/agence#crm',
    'Logiciels sur mesure': '/agence#logiciels',
    'Données': '/agence#donnees',
    'Autres entreprises': '/agence#secteurs'
  };
  document.querySelectorAll('.dd a').forEach(function (a) {
    var b = a.querySelector('b');
    if (b && map[b.textContent]) a.setAttribute('href', map[b.textContent]);
  });
  document.querySelectorAll('.nv').forEach(function (n) {
    var btn = n.querySelector('.nv-b');
    if (btn && /^Agence/.test(btn.textContent.trim()) && !n.querySelector('.dd-foot')) {
      var f = document.createElement('a');
      f.className = 'dd-foot';
      f.href = '/agence';
      f.textContent = 'Voir toute l’agence →';
      n.querySelector('.dd-in').appendChild(f);
    }
  });
})();
