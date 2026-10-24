/* Bouton « Menu » sur téléphone : ouvre et ferme la navigation du haut. */
(function () {
  var h = document.querySelector('header');
  if (!h) return;
  var nav = h.querySelector('nav');
  if (!nav) return;
  var host = nav.parentElement;
  nav.classList.add('m-nav');
  var cta = h.querySelector('a[href="/demo"]');
  if (cta) (cta.parentElement === host ? cta : cta.parentElement).classList.add('m-cta');
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'm-btn';
  b.setAttribute('aria-expanded', 'false');
  b.setAttribute('aria-label', 'Ouvrir le menu');
  b.innerHTML = '<span class="m-ico" aria-hidden="true"></span>Menu';
  host.insertBefore(b, nav);
  function set(o) {
    h.classList.toggle('m-open', o);
    b.setAttribute('aria-expanded', o ? 'true' : 'false');
    b.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu');
  }
  b.addEventListener('click', function (e) { e.stopPropagation(); set(!h.classList.contains('m-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  h.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (a && a.getAttribute('href') && a.getAttribute('target') !== '_blank') set(false);
  });
})();
