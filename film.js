// Lecteur du film de présentation : lecture lancée par le visiteur (avec le son), jamais automatique.
(function () {
  document.querySelectorAll('.fvid').forEach(function (box) {
    var v = box.querySelector('video'), b = box.querySelector('.fplay');
    if (!v || !b) return;
    b.addEventListener('click', function () {
      v.controls = true;
      box.classList.add('on');
      v.play();
      v.focus();
    });
    v.addEventListener('ended', function () {
      v.controls = false;
      v.load();
      box.classList.remove('on');
    });
  });
})();
