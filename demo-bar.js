/* Barre « Réserver une démo » collée en bas sur téléphone. Absente sur /demo. */
(function () {
  if (location.pathname.replace(/\/$/, '') === '/demo') return;
  var mq = window.matchMedia('(max-width: 700px)');
  var bar = document.createElement('div');
  bar.className = 'demo-bar';
  bar.innerHTML = '<a href="/demo">Réserver une démo de 30 min</a>';
  document.body.appendChild(bar);
  var foot = document.querySelector('.site-foot, footer');
  function sync() {
    var show = mq.matches;
    if (show && foot) show = foot.getBoundingClientRect().top > window.innerHeight - 40;
    bar.classList.toggle('on', show);
  }
  sync();
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
})();
