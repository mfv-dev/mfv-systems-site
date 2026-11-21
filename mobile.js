/* Mobile (moins de 900 px), toutes les pages : barre fixe du bas, menu plein écran. L'assistant (chat.js) s'ouvre depuis le bouton rond. */
(function () {
  var bar = document.createElement('div');
  bar.className = 'mbar';
  bar.innerHTML = '<a class="mb-d" href="/demo">Réserver une démo</a><button type="button" class="mb-a" aria-label="Poser une question à l’assistant MFV"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" opacity=".7"/></svg></button>';
  document.body.appendChild(bar);
  bar.querySelector('.mb-a').addEventListener('click', function () { if (window.MFVChat) window.MFVChat.open(); });

  var menu = document.createElement('nav');
  menu.className = 'mmenu'; menu.id = 'mmenu'; menu.setAttribute('aria-label', 'Menu');
  var prod = [['book', 'MFV Book', 'Le moteur de réservation directe', '/book'], ['stay', 'MFV Stay', 'Le PMS pensé pour les hôtels indépendants', '/stay'], ['insight', 'MFV Insight', 'Analyse et performance', '/insight'], ['studio', 'MFV Studio', 'Création digitale et direction artistique', '/studio']];
  var serv = [['Référencement', 'Être trouvé sur Google', '/insight#seo'], ['Sites web et design', 'Pour les hôtels et pour d’autres métiers', '/studio'], ['CRM sur mesure', 'Pour les entreprises de tous secteurs', '/crm-sur-mesure'], ['Données', 'Récupérer et exploiter vos données', '/insight#analytics']];
  menu.innerHTML =
    '<div class="mm-g">Produits</div>' +
    prod.map(function (x) { return '<a class="mm-p" href="' + x[3] + '"><img src="/assets/home/icone_' + x[0] + '.webp" width="44" height="44" alt=""><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span></a>'; }).join('') +
    '<div class="mm-g">Services</div>' +
    serv.map(function (x) { return '<a class="mm-s" href="' + x[2] + '"><span><b>' + x[0] + '</b><small>' + x[1] + '</small></span></a>'; }).join('') +
    '<div class="mm-g">MFV</div>' +
    '<div class="mm-l"><a href="/ressources">Ressources</a><a href="/hebergeurs">Pôle hébergeurs</a><a href="/entreprises">Pôle entreprises</a><a href="/equipe">L’équipe</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div>' +
    '<a class="mm-d" href="/demo">Réserver une démo</a>';
  document.body.appendChild(menu);

  var root = document.documentElement, btn = document.querySelector('.m-btn');
  window.__mmenu = true;
  function set(o) { root.classList.toggle('mm-open', o); if (btn) btn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
  if (btn) {
    btn.innerHTML = '<i></i><i></i>'; btn.setAttribute('aria-label', 'Menu'); btn.setAttribute('aria-controls', 'mmenu');
    btn.addEventListener('click', function () { set(!root.classList.contains('mm-open')); });
  }
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  window.matchMedia('(min-width:901px)').addEventListener('change', function (e) { if (e.matches) set(false); });
})();
