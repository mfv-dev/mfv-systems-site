/* Dégradés entre les sections : au lieu d'une coupure nette entre deux fonds, la jonction fond
   d'une couleur à l'autre.
   - Sections à fond uni : le haut de la section fond depuis la couleur de la précédente, DERRIÈRE
     son contenu, et s'arrête avant le premier élément (le texte reste sur son propre fond).
   - Sections à image ou vidéo plein cadre : un voile fond sur leur bord (haut ou bas). */
(function () {
  var NOFADE = /(^|\s)(hero|better|mh|mbf|mpic|phero)(\s|$)/;           /* jamais de dégradé sur ces sections */
  var MEDIA = /(^|\s)(tilt|recep|accueil|serv|poster|mmetro|mrec|mslides)(\s|$)/;  /* image ou vidéo plein cadre */
  var MIN = 48, MAX = 150, VEIL = 84;

  var style = document.createElement('style');
  style.textContent =
    '.fx{position:relative;isolation:isolate}' +
    '.fx-b{position:absolute;left:0;right:0;pointer-events:none}' +
    '.fx-in{top:0;z-index:-1}.fx-top{top:0;z-index:5}.fx-bot{bottom:0;z-index:5}';
  document.head.appendChild(style);

  function rgb(str) {
    var m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/.exec(str || '');
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  }
  function color(el) {
    var c = rgb(getComputedStyle(el).backgroundColor);
    return (!c || c.a === 0) ? { r: 255, g: 255, b: 255, a: 1 } : c;   /* fond de page blanc */
  }
  function far(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) > 24; }
  function visible(el) { return el.offsetHeight > 0; }
  function topOffset(sec) {
    var first = sec.querySelector('h1,h2,h3,h4,p,.eyebrow,.meb,img,video,form,figure,article');
    if (!first) return 0;
    var y = 0, el = first;
    while (el && el !== sec) { y += el.offsetTop; el = el.offsetParent; }
    return el === sec ? y : first.getBoundingClientRect().top - sec.getBoundingClientRect().top;
  }
  function ramp(c, fromOpaque) {
    var s = [[1, 0], [.78, 22], [.42, 52], [.14, 82], [0, 100]];
    return 'linear-gradient(to ' + (fromOpaque ? 'bottom' : 'top') + ',' + s.map(function (p) {
      return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + p[0] + ') ' + p[1] + '%';
    }).join(',') + ')';
  }
  function veil(sec) { return Math.min(VEIL, Math.max(36, sec.offsetHeight * 0.2)); }
  function add(sec, cls, h, bg) {
    var d = document.createElement('i');
    d.className = 'fx-b ' + cls;
    d.setAttribute('aria-hidden', 'true');
    d.style.height = Math.round(h) + 'px';
    d.style.background = bg;
    sec.appendChild(d);
    sec.classList.add('fx');
  }
  function clean(sec) {
    sec.querySelectorAll(':scope > .fx-b').forEach(function (n) { n.remove(); });
    sec.classList.remove('fx');
  }

  function apply() {
    var pairs = [];
    document.querySelectorAll('main').forEach(function (main) {
      if (!visible(main)) return;
      var kids = Array.prototype.filter.call(main.children, function (e) { return e.tagName === 'SECTION' && visible(e); });
      kids.forEach(clean);
      for (var i = 1; i < kids.length; i++) pairs.push([kids[i - 1], kids[i]]);
      var foot = document.querySelector('footer.foot');
      if (foot && kids.length) { clean(foot); pairs.push([kids[kids.length - 1], foot]); }
    });
    pairs.forEach(function (p) {
      var prev = p[0], cur = p[1], pm = MEDIA.test(prev.className), cm = MEDIA.test(cur.className);
      if (NOFADE.test(cur.className) && !cm) return;
      if (pm && cm) return;
      if (cm) {                                     /* voile sur le haut de l'image, depuis la section précédente */
        if (!NOFADE.test(prev.className) || !pm) add(cur, 'fx-top', veil(cur), ramp(color(prev), true));
        return;
      }
      if (pm) {                                     /* voile sur le bas de l'image, vers la section suivante */
        if (NOFADE.test(prev.className)) return;
        add(prev, 'fx-bot', veil(prev), ramp(color(cur), false));
        return;
      }
      var a = color(prev), b = color(cur);
      if (!far(a, b)) return;
      var h = Math.min(MAX, topOffset(cur) - 14);
      if (h < MIN) return;
      add(cur, 'fx-in', h, ramp(a, true));
    });
  }

  var t;
  function later() { clearTimeout(t); t = setTimeout(apply, 120); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  window.addEventListener('load', apply);
  window.addEventListener('resize', later);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
})();
