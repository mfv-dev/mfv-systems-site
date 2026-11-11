/* Pages produits (Book, Stay, Studio, Insight) : accordéon FAQ et animations communes (le menu, Lenis, le simulateur et les fondus viennent de home.js). */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* FAQ : accordéon (fonctionne sans animation) */
  document.querySelectorAll('.pb .qa').forEach(function (q) {
    var b = q.querySelector('button'), a = q.querySelector('.a');
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () {
      var o = q.classList.toggle('open');
      a.style.height = o ? a.scrollHeight + 'px' : '0px';
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  });

  var cnt = document.querySelector('.cntd');
  if (reduce) { if (cnt) cnt.textContent = cnt.dataset.to; return; }
  if (!window.gsap || !window.ScrollTrigger) { if (cnt) cnt.textContent = cnt.dataset.to; return; }
  gsap.registerPlugin(ScrollTrigger);
  var E = 'expo.out';

  /* Hero : l'image s'ouvre, le titre monte, le reste suit */
  gsap.from('.phero .vis', { clipPath: 'inset(8% 8% 8% 8% round 20px)', opacity: 0, duration: 1.6, ease: E });
  gsap.from('#heroImg', { y: 60, scale: 0.94, duration: 1.8, ease: E, delay: 0.15 });
  gsap.from('.phero h1 .ln span', { yPercent: 110, duration: 1.3, ease: E, delay: 0.25 });
  gsap.from('.hin', { opacity: 0, y: 22, duration: 1.1, ease: 'power3.out', stagger: 0.1, delay: 0.45 });

  /* Parcours : les quatre écrans montent l'un après l'autre */
  if (document.querySelector('.psteps')) gsap.from('.pstep>*', { opacity: 0, y: 70, duration: 1.3, ease: E, stagger: 0.07, scrollTrigger: { trigger: '.psteps', start: 'top 85%' } });

  /* 17 % -> 0 % : le compteur redescend à chaque fois que la carte entre à l'écran */
  if (cnt) {
    var from = +cnt.dataset.from, to = +cnt.dataset.to, o = { v: from }, tw = null;
    cnt.textContent = from;
    var run = function () { if (tw) tw.kill(); o.v = from; cnt.textContent = from; tw = gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { cnt.textContent = Math.round(o.v); } }); };
    var back = function () { if (tw) tw.kill(); cnt.textContent = from; };
    ScrollTrigger.create({ trigger: cnt, start: 'top 88%', end: 'bottom 5%', onEnter: run, onEnterBack: run, onLeave: back, onLeaveBack: back });
  }

  /* Ordinateur seulement : parallaxe de l'image du hero et des écrans, cartes qui se posent */
  gsap.matchMedia().add('(min-width: 901px)', function () {
    gsap.to('#heroImg', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });
    /* l'écran et son texte glissent ensemble : le texte ne passe jamais sous l'écran */
    document.querySelectorAll('.pstep').forEach(function (st) {
      var s = st.querySelector('.scr'); st.dataset.sp = s.dataset.sp;
      gsap.fromTo(st, { y: +st.dataset.sp / 2 }, { y: -st.dataset.sp / 2, ease: 'none', scrollTrigger: { trigger: '.psteps', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray('.cards3 .kc,.cards2 .oc').forEach(function (c) {
      gsap.fromTo(c, { y: 60 }, { y: 0, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 60%', scrub: 1 } });
    });
  });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
