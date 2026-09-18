(function () {
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- Pied de site : cale la marge basse de <main> sur la hauteur réelle du pied ---- */
  var foot = document.querySelector('.site-foot');
  if (foot) {
    var syncFoot = function () {
      if (mq.matches) { document.body.style.removeProperty('--foot-h'); return; }
      document.body.style.setProperty('--foot-h', foot.offsetHeight + 'px');
    };
    syncFoot();
    window.addEventListener('resize', syncFoot);
    window.addEventListener('load', syncFoot);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncFoot);
    if (mq.addEventListener) mq.addEventListener('change', syncFoot);
  }

  /* ---- Barre du haut : verre dépoli dès qu'on scrolle ---- */
  var header = document.querySelector('header');
  if (header) {
    var syncHeader = function () {
      header.classList.toggle('scrolled', window.scrollY > 32);
    };
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  }

  /* ---- Apparition au scroll ---- */
  if (!mq.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-anim');
    var groups = document.querySelectorAll('main section:not(.hero) .shell');
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].children;
      for (var i = 0; i < kids.length; i++) {
        kids[i].classList.add('anim');
        kids[i].style.transitionDelay = Math.min(i * 60, 240) + 'ms';
      }
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    document.querySelectorAll('.anim').forEach(function (el) { io.observe(el); });
  }

  /* ---- Simulateur de commissions (page d'accueil) ---- */
  var sim = document.getElementById('sim');
  if (sim) {
    var eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    var ids = ['rooms', 'occ', 'adr', 'share', 'comm'];
    var el = {};
    ids.forEach(function (id) { el[id] = document.getElementById(id); });

    function calc() {
      var rooms = +el.rooms.value,
          occ = +el.occ.value / 100,
          adr = +el.adr.value,
          share = +el.share.value / 100,
          comm = +el.comm.value / 100;

      document.getElementById('o-rooms').textContent = rooms;
      document.getElementById('o-occ').textContent = el.occ.value + ' %';
      document.getElementById('o-adr').textContent = eur.format(adr);
      document.getElementById('o-share').textContent = el.share.value + ' %';
      document.getElementById('o-comm').textContent = el.comm.value + ' %';

      var nights = rooms * 365 * occ;
      var otaRevenue = nights * share * adr;
      var commission = otaRevenue * comm;

      document.getElementById('res-ota').textContent = eur.format(commission);
      document.getElementById('res-mfv').textContent = '0 €';
      var five = document.getElementById('res-5y');
      if (five) five.textContent = eur.format(commission * 5);
    }

    ids.forEach(function (id) { el[id].addEventListener('input', calc); });
    calc();
  }
})();
