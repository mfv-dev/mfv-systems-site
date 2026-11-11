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

  /* Insight, Référencement : la recherche Google se remplit et le site monte à la première place */
  var seoDraw = null;
  if (document.getElementById('res')) {
    var $ = function (id) { return document.getElementById(id); };
    const R=[['comparateur-hotels.fr','Hôtels à Paris Opéra : comparez les prix','Plus de 300 hôtels autour de l’Opéra, réservez en ligne.'],
   ['plateforme-voyage.com','Les 10 meilleurs hôtels boutique de Paris','Notre sélection 2026 d’hôtels de charme dans le 9e arrondissement.'],
   ['guide-paris.fr','Où dormir près de l’Opéra Garnier ?','Quartiers, adresses et conseils pour votre séjour à Paris.'],
   ['reserver-hotel.com','Hôtel Opéra Paris · Offres du moment','Réservez maintenant, payez sur place. Annulation gratuite.'],
   ['avis-voyageurs.com','Hôtels boutique Paris : avis et photos','Découvrez les avis des voyageurs sur les hôtels du quartier.'],
   ['blog-escapade.fr','Un week-end à Paris côté Opéra','Nos adresses préférées pour un séjour élégant.'],
   ['annuaire-hotels.fr','Liste des hôtels du 9e arrondissement','Coordonnées et catégories des hôtels parisiens.']];
   const me=['hotel-paris-opera.fr','Hôtel Paris Opéra · Site officiel','Hôtel indépendant au cœur de l’Opéra. Meilleur tarif garanti en réservant en direct.'];
   const box=$('res'), H=76, els=[];
   R.forEach(r=>{const d=document.createElement('div');d.className='r';d.innerHTML=`<div class="u"><i></i>${r[0]}</div><div class="t">${r[1]}</div><div class="d">${r[2]}</div>`;box.appendChild(d);els.push(d)});
   const m=document.createElement('div');m.className='r me';m.innerHTML=`<div class="u"><i></i>${me[0]}</div><div class="t">${me[1]}</div><div class="d">${me[2]}</div><span class="pos" id="posTag">#8</span>`;box.appendChild(m);
   const Q='hôtel boutique paris opéra',q=$('q'),line=$('kLine'),L=line.getTotalLength();line.style.strokeDasharray=L;
   function draw(p){ // p 0..1
    q.textContent=Q.slice(0,Math.round(Math.min(1,p/0.18)*Q.length));
    const k=Math.min(1,Math.max(0,(p-0.22)/0.6)), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    const pos=7-7*e; // 7 -> 0 index
    m.style.top=(pos*H+2)+'px';
    els.forEach((d,i)=>{const slot=i<Math.round(pos)?i:i+1; const shift=(i>=pos-1&&i<pos)?0:0; d.style.top=((i>=pos?i+1:i)*H+8)+'px'; d.style.opacity=1});
    const P=Math.max(1,Math.round(8-7*e)); $('kPos').textContent=P; $('posTag').textContent='#'+P;
    $('kClk').textContent=Math.round(120+(1840-120)*e).toLocaleString('fr-FR');
    line.style.strokeDashoffset=L*(1-e);
   }
   els.forEach(d=>d.style.transition='top .35s cubic-bezier(.16,1,.3,1)');m.style.transition='top .35s cubic-bezier(.16,1,.3,1)';
   draw(0);
   if(matchMedia('(max-width:900px)').matches){ScrollTrigger.create({trigger:'#seo',start:'top 70%',once:true,onEnter:()=>{const o={p:0};gsap.to(o,{p:1,duration:4,ease:'none',onUpdate:()=>draw(o.p)})}})}
    seoDraw = draw;
  }

  var cnt = document.querySelector('.cntd');
  if (reduce) { if (cnt) cnt.textContent = cnt.dataset.to; if (seoDraw) seoDraw(1); return; }
  if (!window.gsap || !window.ScrollTrigger) { if (cnt) cnt.textContent = cnt.dataset.to; if (seoDraw) seoDraw(1); return; }
  gsap.registerPlugin(ScrollTrigger);
  var E = 'expo.out';
  /* Référencement : ordinateur = section épinglée (320 vh) qui suit le scroll ; mobile = 4 s à l'entrée */
  if (seoDraw) {
    if (matchMedia('(max-width:900px)').matches) ScrollTrigger.create({ trigger: '#seo', start: 'top 70%', once: true, onEnter: function () { var o = { p: 0 }; gsap.to(o, { p: 1, duration: 4, ease: 'none', onUpdate: function () { seoDraw(o.p); } }); } });
    else ScrollTrigger.create({ trigger: '#seo', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: function (s) { seoDraw(s.progress); } });
  }

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
  /* Stay : l'image des appareils glisse de 60 px vers la gauche et passe de 1,06 à 1 */
  if (document.querySelector('.ecr-img')) gsap.fromTo('.ecr-img', { scale: 1.06, x: 60 }, { scale: 1, x: 0, ease: 'none', scrollTrigger: { trigger: '.ecr', start: 'top bottom', end: 'center center', scrub: 1 } });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
