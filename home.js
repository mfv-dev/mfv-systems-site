/* Accueil MFV Systems v2, étape 1 : menu et hero. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');

  /* Simulateur de commissions (fonctionne sans animation) */
  var eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var nb = function (s) { return s.replace(/\u202f/g, '\u00a0'); };
  var $ = function (id) { return document.getElementById(id); };
  if ($('rooms')) {
    var sim = function () {
      var r = +$('rooms').value, o = +$('occ').value, a = +$('adr').value, s = +$('ota').value, c = +$('com').value;
      $('vRooms').textContent = r; $('vOcc').textContent = o + ' %'; $('vAdr').textContent = nb(eur.format(a));
      $('vOta').textContent = s + ' %'; $('vCom').textContent = c + ' %';
      $('oPaid').textContent = nb(eur.format(r * 365 * (o / 100) * a * (s / 100) * (c / 100)));
    };
    ['rooms', 'occ', 'adr', 'ota', 'com'].forEach(function (i) { $(i).addEventListener('input', sim); });
    sim();
  }

  /* Menu : sous-menus et bouton mobile */
  var items = document.querySelectorAll('.nv');
  function closeAll(except) {
    items.forEach(function (n) { if (n !== except) { n.classList.remove('open'); var b = n.querySelector('.nv-b'); if (b) b.setAttribute('aria-expanded', 'false'); } });
  }
  items.forEach(function (n) {
    var b = n.querySelector('.nv-b'); if (!b) return;
    b.addEventListener('click', function (e) {
      var o = !n.classList.contains('open'); closeAll(n); n.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); e.stopPropagation();
    });
  });
  document.addEventListener('click', function () { closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  var mb = document.querySelector('.m-btn');
  if (mb) mb.addEventListener('click', function () {
    var o = !nav.classList.contains('open'); nav.classList.toggle('open', o); mb.setAttribute('aria-expanded', o ? 'true' : 'false');
  });

  /* Hero : un mot, une pause, le suivant (version validée hero_mots) */
  var video = document.querySelector('.hero video');
  var lines = [].slice.call(document.querySelectorAll('.hero h1 .ln>span')), after = [].slice.call(document.querySelectorAll('.hero .after'));
  function loadFrame() { if (window.MFVBook) window.MFVBook.start(); if (window.MFVChat) window.MFVChat.start(); }
  if (reduce) {
    loadFrame();
    lines.concat(after).forEach(function (e) { e.style.transform = 'none'; e.style.opacity = 1; });
    document.querySelectorAll('video').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
    document.querySelectorAll('.fade').forEach(function (e) { e.style.opacity = 1; e.style.transform = 'none'; });
    document.querySelectorAll('.cnt').forEach(function (c) { c.textContent = c.dataset.to; });
    return;
  }
  setTimeout(loadFrame, 350 + lines.length * 750 + 1200);
  var E = 'cubic-bezier(.16,1,.3,1)';
  after[0].animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 100, easing: E, fill: 'both' });
  lines.forEach(function (l, i) {
    l.animate([{ transform: 'translateY(110%)', filter: 'blur(10px)', opacity: 0 }, { transform: 'none', filter: 'blur(0)', opacity: 1 }], { duration: 1300, delay: 350 + i * 750, easing: E, fill: 'both' });
  });
  var t = 350 + lines.length * 750 + 250;
  after.slice(1).forEach(function (a, i) {
    a.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: t + i * 120, easing: E, fill: 'both' });
  });

  /* Menu : défilement lissé, opaque après 40 px, se cache en descendant */
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (tt) { lenis.raf(tt * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var tg = document.querySelector(a.getAttribute('href')); if (!tg) return;
        e.preventDefault(); nav.classList.remove('open'); lenis.scrollTo(tg, { offset: -20, duration: 1.6 });
      });
    });
  }


  /* Chiffres : les compteurs repartent de 0 et défilent à chaque fois que la section entre à l'écran */
  document.querySelectorAll('.cnt').forEach(function (el) {
    var to = +el.dataset.to, o = { v: 0 }, tw = null;
    function run() {
      if (tw) tw.kill();
      o.v = 0; el.textContent = '0';
      tw = gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
    }
    ScrollTrigger.create({ trigger: el, start: 'top 88%', end: 'bottom 5%', onEnter: run, onEnterBack: run, onLeave: function () { if (tw) tw.kill(); el.textContent = '0'; }, onLeaveBack: function () { if (tw) tw.kill(); el.textContent = '0'; } });
  });

  /* Affiche : un simple fondu à l'arrivée */
  gsap.to('.fadeo', { opacity: 1, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: '.fadeo', start: 'top 85%' } });

  /* Le constat : les mots se révèlent au défilement (ordinateur et mobile) */
  var m = document.getElementById('manif');
  if (m) m.innerHTML = m.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
  gsap.to('#manif .w', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '#manif', start: 'top 80%', end: 'bottom 45%', scrub: true } });
  gsap.utils.toArray('.fade').forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* « Il existe une meilleure façon » : le titre se précise et reste écrit jusqu'à la fin de la section (ordinateur seulement, rien d'épinglé sur mobile) */
  gsap.matchMedia().add('(min-width: 901px)', function () {
    gsap.fromTo('#betterT', { scale: 0.7, opacity: 0, filter: 'blur(8px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'none', scrollTrigger: { trigger: '#better', start: 'top 70%', end: 'center center', scrub: true } });

    /* Quatre produits : chaque panneau recule quand le suivant arrive, et les cartes d'interface flottent à leur propre vitesse */

    /* Icône de chaque produit : position fixe sur le panneau, apparaît (de 0,6 à 1) quand le panneau arrive */
    gsap.utils.toArray('.bdg').forEach(function (b) {
      gsap.set(b, { scale: 0.6, opacity: 0 });
      gsap.to(b, { scale: 1, opacity: 1, duration: 1.1, ease: 'elastic.out(1, 0.6)', scrollTrigger: { trigger: b.closest('.panel'), start: 'top 70%', once: true } });
    });
    /* Photo de la réception : elle s'ouvre (clip-path) et glisse doucement à l'intérieur de son cadre */
    document.querySelectorAll('[data-par]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray('.nums .ph,.dev .ph').forEach(function (ph) {
      gsap.from(ph, { clipPath: 'inset(12% 12% 12% 12% round 22px)', ease: 'none', scrollTrigger: { trigger: ph, start: 'top 95%', end: 'top 35%', scrub: true } });
    });
    /* Grille de slides : très léger glissement et zoom de 1 à 1,04 au plus */
    gsap.fromTo('#tiltImg', { xPercent: -1.6, yPercent: -1.2, scale: 1 }, { xPercent: 1.6, yPercent: 1.2, scale: 1.04, ease: 'none', scrollTrigger: { trigger: '#tilt', start: 'top bottom', end: 'bottom top', scrub: true } });
    /* Vos gains : le tableau de bord se redresse */
    gsap.fromTo('#gshot', { scale: 0.86, rotateX: 14, y: 60 }, { scale: 1, rotateX: 0, y: 0, ease: 'none', transformPerspective: 1400, scrollTrigger: { trigger: '#gshot', start: 'top 95%', end: 'top 25%', scrub: true } });
    var panels = gsap.utils.toArray('.panel');
    panels.forEach(function (p, i) {
      if (i < panels.length - 1) gsap.to(p, { scale: 0.94, ease: 'none', scrollTrigger: { trigger: panels[i + 1], start: 'top bottom', end: 'top 12%', scrub: true } });
      p.querySelectorAll('.card').forEach(function (c) {
        gsap.fromTo(c, { y: -(+c.dataset.sp) }, { y: +c.dataset.sp, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
  });
  /* Rubans animés en CSS : en pause hors écran */
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (es) { es.forEach(function (x) { x.target.classList.toggle('paused', !x.isIntersecting); }); }, { rootMargin: '200px' });
    document.querySelectorAll('.rib').forEach(function (e) { rio.observe(e); });
  }

  /* Vidéo de l'iPhone : repart de 0 quand la section entre à l'écran, pour voir la notification s'ouvrir */
  if ('IntersectionObserver' in window) {
    var rv = document.querySelector('video[data-restart]');
    if (rv) new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { rv.currentTime = 0; var pr = rv.play(); if (pr && pr.catch) pr.catch(function () {}); } else rv.pause(); });
    }, { threshold: 0.35 }).observe(rv);
  }
  /* Vidéos : en pause hors écran (elles démarrent 600 px avant d'apparaître) */
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (x) { var v = x.target; if (x.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); });
    }, { rootMargin: '600px 0px' });
    document.querySelectorAll('video:not([data-restart])').forEach(function (v) { vio.observe(v); });
  }
  var last = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) {
    var y = s.scroll();
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > last && y > 400 && !nav.classList.contains('open'));
    last = y;
  } });
})();
