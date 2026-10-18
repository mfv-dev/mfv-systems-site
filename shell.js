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
