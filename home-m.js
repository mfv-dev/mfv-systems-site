/* Accueil mobile (moins de 900 px) : animations par IntersectionObserver, défilement natif. Suit la maquette validée accueil_mobile. */
(function () {
  if (!window.matchMedia('(max-width:900px)').matches) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = $('#m-main'); if (!root) return;

  /* Hero : les mots arrivent l'un après l'autre, puis la notification glisse du haut */
  var hero = $('#m-top'), lines = $$('.mln>span', hero);
  if (reduce) { hero.classList.add('go'); $('#m-notif').classList.add('show'); }
  else {
    requestAnimationFrame(function () {
      lines.forEach(function (l, i) { l.style.transitionDelay = (0.3 + i * 0.75) + 's'; });
      hero.classList.add('go');
    });
    setTimeout(function () { $('#m-notif').classList.add('show'); }, 3300);
  }

  /* Textes dont les mots s'allument au défilement */
  $$('[data-words]', root).forEach(function (p) {
    var ac = +(p.dataset.accent || 0), txt = p.textContent.trim().replace(/\s+/g, ' ');
    p.setAttribute('aria-label', txt);
    var ws = txt.split(' ');
    p.innerHTML = ws.map(function (w, i) { return '<span class="wd' + (ac && i >= ws.length - ac ? ' ac' : '') + '" aria-hidden="true">' + w + '</span>'; }).join(' ');
  });
  function words() {
    var vh = window.innerHeight;
    $$('[data-words]', root).forEach(function (p) {
      var pr;
      var r = p.getBoundingClientRect(); pr = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      pr = Math.max(0, Math.min(1, pr));
      var ws = p.querySelectorAll('.wd'), n = reduce ? ws.length : Math.round(pr * ws.length);
      ws.forEach(function (w, i) { w.style.opacity = i < n ? 1 : 0.13; });
    });
  }
  var tick = false;
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { words(); tick = false; }); } }, { passive: true });
  words();

  /* « Il existe une meilleure façon » : une seule animation, déclenchée à 45 % de visibilité */
  var bf = $('#m-better');
  if (bf) {
    var bw = $$('.mbw', bf), bl = $$('.mbl', bf);
    if (reduce) bf.classList.add('go');
    else {
      bw.forEach(function (w, i) { w.style.transitionDelay = (i * 0.14) + 's'; });
      bl.forEach(function (l, i) { l.style.transitionDelay = (1 + i * 0.35) + 's'; });
      new IntersectionObserver(function (es, o) { es.forEach(function (x) { if (x.isIntersecting) { bf.classList.add('go'); o.disconnect(); } }); }, { threshold: 0.45 }).observe(bf);
    }
  }

  /* Apparitions */
  if (reduce) $$('.mup', root).forEach(function (e) { e.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
    $$('.mup', root).forEach(function (e) { io.observe(e); });
  }

  /* Compteurs */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, to = +el.dataset.to, t0 = performance.now();
      if (reduce) { el.textContent = to; cio.unobserve(el); return; }
      (function f(t) { var k = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-to]', root).forEach(function (e) { cio.observe(e); });

  /* Vidéo de l'iPhone : repart de 0 quand elle apparaît (la lecture et la pause sont gérées par home.js) */
  var isl = $('#m-islv');
  if (isl && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { try { isl.currentTime = 0; } catch (e) {} } }); }, { threshold: 0.35 }).observe(isl);

  /* Carrousel des produits : points de progression */
  var car = $('#m-car'), dots = $$('#m-dots i');
  if (car) car.addEventListener('scroll', function () {
    var i = Math.round(car.scrollLeft / (car.firstElementChild.offsetWidth + 12));
    dots.forEach(function (d, j) { d.classList.toggle('on', j === i); });
  }, { passive: true });

  /* Simulateur : même formule et même mise en forme que le bureau */
  var eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var nb = function (s) { return s.replace(/ /g, ' '); };
  var g = function (id) { return document.getElementById(id); };
  var sim = function () {
    var r = +g('m-rooms').value, o = +g('m-occ').value, a = +g('m-adr').value, s = +g('m-ota').value, c = +g('m-com').value;
    g('m-vRooms').textContent = r; g('m-vOcc').textContent = o + ' %'; g('m-vAdr').textContent = nb(eur.format(a));
    g('m-vOta').textContent = s + ' %'; g('m-vCom').textContent = c + ' %';
    g('m-paid').textContent = nb(eur.format(r * 365 * (o / 100) * a * (s / 100) * (c / 100)));
  };
  ['m-rooms', 'm-occ', 'm-adr', 'm-ota', 'm-com'].forEach(function (i) { g(i).addEventListener('input', sim); });
  sim();

  /* Formulaire : relais /api/lead */
  var f = g('m-form');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = g('m-fmsg'), btn = g('m-fbtn'), mail = 'contact@mfv-systems.fr';
    var email = f.email.value.trim(), hotel = f.hotel.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Merci de saisir une adresse e-mail valide.'; return; }
    btn.disabled = true; msg.textContent = 'Envoi en cours...';
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, hotel: hotel, website: f.website.value }) })
      .then(function (r) { return r.status; })
      .then(function (st) {
        btn.disabled = false;
        if (st === 200) { msg.textContent = 'Merci, nous revenons vers vous très vite.'; f.reset(); }
        else if (st === 400) msg.textContent = 'Cette adresse e-mail ne semble pas valide.';
        else if (st === 429) msg.textContent = 'Trop de tentatives, réessayez dans quelques minutes.';
        else msg.textContent = 'L’envoi est momentanément indisponible. Écrivez-nous à ' + mail + '.';
      })
      .catch(function () { btn.disabled = false; msg.textContent = 'Connexion impossible. Écrivez-nous à ' + mail + '.'; });
  });
})();
