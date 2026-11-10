/* Accueil MFV Systems v2 : Lenis + GSAP ScrollTrigger. Tout s'affiche tel quel si le mouvement est réduit. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 901px)');

  /* Simulateur de commissions (fonctionne sans GSAP) */
  var eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  function sim() {
    var r = +$('rooms').value, o = +$('occ').value, a = +$('adr').value, s = +$('ota').value, c = +$('com').value;
    $('vRooms').textContent = r; $('vOcc').textContent = o + ' %'; $('vAdr').textContent = eur.format(a).replace(/\u202f/g, '\u00a0');
    $('vOta').textContent = s + ' %'; $('vCom').textContent = c + ' %';
    $('oPaid').textContent = eur.format(r * 365 * (o / 100) * a * (s / 100) * (c / 100)).replace(/\u202f/g, '\u00a0');
  }
  ['rooms', 'occ', 'adr', 'ota', 'com'].forEach(function (i) { $(i).addEventListener('input', sim); }); sim();

  /* Formulaire de démo : relais /api/lead (adresse e-mail seulement) */
  var f = $('lead-form');
  if (f) {
    var msg = $('lead-msg'), btn = $('lead-btn'), mail = 'contact@mfv-systems.fr';
    var say = function (t) { msg.textContent = t; };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('Merci de saisir une adresse e-mail valide.'); return; }
      btn.disabled = true; say('Envoi en cours...');
      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, website: f.website.value }) })
        .then(function (r) { return r.status; })
        .then(function (st) {
          btn.disabled = false;
          if (st === 200) { say('Merci, nous revenons vers vous très vite.'); f.reset(); }
          else if (st === 400) say('Cette adresse e-mail ne semble pas valide.');
          else if (st === 429) say('Trop de tentatives, réessayez dans quelques minutes.');
          else say("L'envoi est momentanément indisponible. Écrivez-nous à " + mail + '.');
        })
        .catch(function () { btn.disabled = false; say('Connexion impossible. Écrivez-nous à ' + mail + '.'); });
    });
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
  var nav = $('nav'), mb = document.querySelector('.m-btn');
  if (nav && mb) mb.addEventListener('click', function () {
    var o = !nav.classList.contains('open'); nav.classList.toggle('open', o); mb.setAttribute('aria-expanded', o ? 'true' : 'false');
  });

  /* Mots du constat */
  var m = $('manif');
  if (m) m.innerHTML = m.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');

  /* Vidéos : en pause hors écran, et sur leur poster si le mouvement est réduit */
  var vids = document.querySelectorAll('video');
  if (reduce) vids.forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  else if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (x) { var v = x.target; if (x.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
    }, { rootMargin: '600px 0px' });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* Images : décodées d'avance, pour ne pas bloquer le défilement quand elles arrivent à l'écran */
  window.addEventListener('load', function () {
    var imgs = [].slice.call(document.images), i = 0;
    (function next() {
      if (i >= imgs.length) return;
      var im = imgs[i++];
      (im.decode ? im.decode() : Promise.resolve()).catch(function () {}).then(function () { (window.requestIdleCallback || function (f) { setTimeout(f, 30); })(next); });
    })();
  });

  /* Rubans animés en CSS : en pause hors écran */
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (es) { es.forEach(function (x) { x.target.classList.toggle('paused', !x.isIntersecting); }); }, { rootMargin: '200px' });
    document.querySelectorAll('.rib,.rb').forEach(function (e) { rio.observe(e); });
  }

  /* Compteurs : valeur finale tout de suite si GSAP est absent ou si le mouvement est réduit */
  var cnts = document.querySelectorAll('.cnt');
  function showAll() {
    document.querySelectorAll('.fade').forEach(function (e) { e.style.opacity = 1; e.style.transform = 'none'; });
    document.querySelectorAll('#manif .w').forEach(function (w) { w.style.opacity = 1; });
    cnts.forEach(function (c) { c.textContent = c.dataset.to; });
  }
  if (!window.gsap || !window.ScrollTrigger || reduce) { showAll(); return; }

  gsap.registerPlugin(ScrollTrigger);
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var t = document.querySelector(id); if (!t) return;
        e.preventDefault(); if (nav) nav.classList.remove('open'); lenis.scrollTo(t, { offset: -20, duration: 1.6 });
      });
    });
  }

  /* Nav : opaque après 40 px, se cache en descendant */
  var last = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) {
    var y = s.scroll();
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > last && y > 400 && !nav.classList.contains('open'));
    last = y;
  } });

  /* Fondus génériques, valables partout (aussi sur mobile) */
  gsap.utils.toArray('.fade').forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* Compteurs */
  cnts.forEach(function (el) {
    var to = +el.dataset.to, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () {
      gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
    } });
  });

  /* Arrivée du hero (aussi sur mobile) */
  gsap.from('.hero h1 .ln span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.15 });
  gsap.from('.hero-in', { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.5 });
  gsap.from('.tabs img', { x: 160, opacity: 0, duration: 1.6, ease: 'expo.out', stagger: 0.12, delay: 0.25 });

  /* Mouvements liés au scroll : ordinateur seulement, rien n'est épinglé sur mobile */
  gsap.matchMedia().add('(min-width: 901px)', function () {
    var ht = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    ht.to('.tabs .t1', { y: -180, x: -40, ease: 'none' }, 0).to('.tabs .t3', { y: 220, x: 60, ease: 'none' }, 0).to('.tabs .t2', { x: -20, ease: 'none' }, 0)
      .to('.hero .wrap', { y: -120, opacity: 0, ease: 'none' }, 0).to('.hero video.bg', { scale: 1.15, ease: 'none' }, 0);

    gsap.to('#manif .w', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '#manif', start: 'top 80%', end: 'bottom 45%', scrub: true } });

    gsap.fromTo('#betterT', { scale: 0.7, opacity: 0, filter: 'blur(8px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'none', scrollTrigger: { trigger: '#better', start: 'top 70%', end: 'center center', scrub: true } });
    gsap.to('#betterT', { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#better', start: 'center top', end: 'bottom top', scrub: true } });

    var rt = gsap.timeline({ scrollTrigger: { trigger: '#reveal', start: 'top top', end: 'bottom bottom', scrub: true } });
    rt.to('#rframe', { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut' }, 0).to('#rframe img', { scale: 1, ease: 'power2.inOut' }, 0).to('#rcap', { opacity: 1 }, 0.6);

    var panels = gsap.utils.toArray('.panel');
    panels.forEach(function (p, i) {
      if (i < panels.length - 1) gsap.to(p, { scale: 0.92, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: panels[i + 1], start: 'top bottom', end: 'top 12%', scrub: true } });
      p.querySelectorAll('.card').forEach(function (c) {
        gsap.fromTo(c, { y: -(+c.dataset.sp) }, { y: +c.dataset.sp, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });

    document.querySelectorAll('[data-par]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray('.nums .ph,.dev .ph').forEach(function (ph) {
      gsap.from(ph, { clipPath: 'inset(12% 12% 12% 12% round 22px)', ease: 'none', scrollTrigger: { trigger: ph, start: 'top 95%', end: 'top 35%', scrub: true } });
    });

    gsap.fromTo('#tiltImg', { xPercent: -44, yPercent: -56, scale: 1.18 }, { xPercent: -56, yPercent: -44, scale: 1, ease: 'none', scrollTrigger: { trigger: '#tilt', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('#gshot', { scale: 0.86, rotateX: 14, y: 60 }, { scale: 1, rotateX: 0, y: 0, ease: 'none', transformPerspective: 1400, scrollTrigger: { trigger: '#gshot', start: 'top 95%', end: 'top 25%', scrub: true } });

    gsap.fromTo('#track', { x: '8vw' }, { x: function () { return -($('track').scrollWidth - innerWidth * 0.8); }, ease: 'none', scrollTrigger: { trigger: '.metro', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });

    gsap.fromTo('#dcard', { y: 80, rotate: -4 }, { y: -60, rotate: 2, ease: 'none', scrollTrigger: { trigger: '.demo', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('footer .huge', { yPercent: 60, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });

  /* Mobile : le constat se révèle sans scrub */
  gsap.matchMedia().add('(max-width: 900px)', function () {
    gsap.to('#manif .w', { opacity: 1, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: '#manif', start: 'top 85%', end: 'bottom 55%', scrub: true } });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
