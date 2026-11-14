/* Mobile (moins de 900 px), toutes les pages : barre fixe du bas, menu plein écran. L'assistant (chat.js) s'ouvre depuis le bouton rond. */
(function () {
  var bar = document.createElement('div');
  bar.className = 'mbar';
  bar.innerHTML = '<a class="mb-d" href="/demo">Réserver une démo</a><button type="button" class="mb-a" aria-label="Poser une question à l’assistant MFV"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" opacity=".7"/></svg></button>';
  document.body.appendChild(bar);
  bar.querySelector('.mb-a').addEventListener('click', function () { if (window.MFVChat) window.MFVChat.open(); });

  var menu = document.createElement('nav');
  menu.className = 'mmenu'; menu.id = 'mmenu'; menu.setAttribute('aria-label', 'Menu');
  menu.innerHTML = '<a href="/#m-produits">Produits</a><a href="/#m-resultats">Résultats</a><a href="/equipe">L’équipe</a><a href="/faq">FAQ</a><a href="/contact">Contact</a>' +
    '<div class="mm-i"><a href="/book" aria-label="MFV Book"><img src="/assets/home/icone_book.webp" width="56" height="56" alt=""></a><a href="/stay" aria-label="MFV Stay"><img src="/assets/home/icone_stay.webp" width="56" height="56" alt=""></a><a href="/studio" aria-label="MFV Studio"><img src="/assets/home/icone_studio.webp" width="56" height="56" alt=""></a><a href="/insight" aria-label="MFV Insight"><img src="/assets/home/icone_insight.webp" width="56" height="56" alt=""></a></div>';
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
