/* Accueil MFV Systems v2, étape 1 : menu et hero. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');

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
  function loadFrame() { if (window.MFVBook) window.MFVBook.start(); }
  if (reduce) {
    loadFrame();
    lines.concat(after).forEach(function (e) { e.style.transform = 'none'; e.style.opacity = 1; });
    if (video) { video.removeAttribute('autoplay'); video.pause(); }
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

  /* Le constat : les mots se révèlent au défilement (ordinateur et mobile) */
  var m = document.getElementById('manif');
  if (m) m.innerHTML = m.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
  gsap.to('#manif .w', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '#manif', start: 'top 80%', end: 'bottom 45%', scrub: true } });
  gsap.utils.toArray('.fade').forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* « Il existe une meilleure façon » : le titre se précise puis s'efface (ordinateur seulement, rien d'épinglé sur mobile) */
  gsap.matchMedia().add('(min-width: 901px)', function () {
    gsap.fromTo('#betterT', { scale: 0.7, opacity: 0, filter: 'blur(8px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'none', scrollTrigger: { trigger: '#better', start: 'top 70%', end: 'center center', scrub: true } });
    gsap.to('#betterT', { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#better', start: 'center top', end: 'bottom top', scrub: true } });
    /* L'affiche s'ouvre : du centre vers le plein écran, avec un léger dézoom */
    var rt = gsap.timeline({ scrollTrigger: { trigger: '#reveal', start: 'top top', end: 'bottom bottom', scrub: true } });
    rt.to('#rframe', { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut' }, 0).to('#rframe img', { scale: 1, ease: 'power2.inOut' }, 0).to('#rcap', { opacity: 1 }, 0.6);
  });
  /* Rubans animés en CSS : en pause hors écran */
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (es) { es.forEach(function (x) { x.target.classList.toggle('paused', !x.isIntersecting); }); }, { rootMargin: '200px' });
    document.querySelectorAll('.rib').forEach(function (e) { rio.observe(e); });
  }
  var last = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) {
    var y = s.scroll();
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > last && y > 400 && !nav.classList.contains('open'));
    last = y;
  } });
})();
