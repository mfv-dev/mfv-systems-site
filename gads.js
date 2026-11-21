/* Suivi Google Ads (Consent Mode v2) + bandeau de consentement.
   Valeurs publiques : elles figurent aussi dans .env.example, à garder identiques. */
(function () {
  var GADS_ID = 'AW-18514632138';
  var DEMO_SEND_TO = 'AW-18514632138/15tfCJ_7sbwdEMq7u_xE';       /* conversion « Démo réservée » */
  var CONTACT_SEND_TO = 'AW-18514632138/cga8CPeGsrwdEMq7u_xE';    /* conversion « Formulaire de contact » */
  var KEY = 'mfv-consent';
  var PREVIEW = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function read() { try { var v = localStorage.getItem(KEY); return v === 'granted' || v === 'denied' ? v : null; } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function state(v) {
    var s = v === 'granted' ? 'granted' : 'denied';
    return { ad_storage: s, ad_user_data: s, ad_personalization: s, analytics_storage: s };
  }
  function purge() {
    var host = location.hostname.split('.').slice(-2).join('.');
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^(_gcl|_ga|_gac|FPAU|FPLC)/.test(n)) {
        [location.hostname, '.' + host, ''].forEach(function (d) {
          document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  /* 1. Mode strict : rien n'est chargé tant que le visiteur n'a pas accepté. */
  gtag('consent', 'default', state('denied'));
  var loaded = false;
  function activate() {
    if (loaded) return;
    loaded = true;
    gtag('consent', 'update', state('granted'));
    gtag('js', new Date());
    gtag('config', GADS_ID);
    if (!PREVIEW) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GADS_ID;
      document.head.appendChild(s);
    }
  }
  if (read() === 'granted') activate();

  /* 2. Conversions : appelées après une réponse OK du serveur, seulement si le visiteur a accepté. */
  function convert(sendTo) {
    if (PREVIEW || !loaded) return;
    gtag('event', 'conversion', { send_to: sendTo, value: 1.0, currency: 'EUR' });
  }
  window.mfvTrackDemo = function () { convert(DEMO_SEND_TO); };        /* book.js, après /api/book */
  window.mfvTrackContact = function () { convert(CONTACT_SEND_TO); };  /* contact.html, après /api/lead */

  /* 3. Bandeau : « Accepter » et « Refuser » de même poids. */
  var css = document.createElement('style');
  css.textContent =
    '.ck{position:fixed;left:16px;bottom:16px;z-index:2147483000;width:min(420px,calc(100vw - 32px));background:#fff;color:#0B0B0F;' +
    'border:1px solid #E4E4EA;border-radius:12px;padding:18px 18px 16px;box-shadow:0 18px 40px -18px rgba(11,11,15,.35);' +
    'font:14px/1.5 Geist,system-ui,sans-serif}' +
    '.ck p{margin:0 0 14px;color:#0B0B0F}.ck p a{color:inherit;text-decoration:underline}' +
    '.ck b{display:block;font-weight:600;margin-bottom:4px}' +
    '.ck div{display:flex;gap:10px}' +
    '.ck button{flex:1;font:inherit;font-weight:600;padding:11px 14px;border-radius:9px;cursor:pointer;background:#fff;color:#0B0B0F;border:1px solid #0B0B0F}' +
    '.ck button:hover{background:#0B0B0F;color:#fff}' +
    '.ck button:focus-visible{outline:2px solid #4F46E5;outline-offset:3px}';
  document.head.appendChild(css);

  var box = null;
  function close() { if (box) { box.remove(); box = null; } }
  function choose(v) {
    write(v);
    if (v === 'granted') activate();
    else { if (loaded) gtag('consent', 'update', state('denied')); purge(); }
    close();
  }
  function open() {
    if (box) return;
    box = document.createElement('div');
    box.className = 'ck';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookies');
    box.innerHTML =
      '<p><b>Cookies de mesure et de publicité</b>Nous utilisons des cookies pour mesurer l’efficacité de nos annonces Google. ' +
      'Vous pouvez les accepter ou les refuser. <a href="/confidentialite#cookies">En savoir plus</a></p>' +
      '<div><button type="button" data-v="denied">Refuser</button><button type="button" data-v="granted">Accepter</button></div>';
    box.addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (b) choose(b.dataset.v); });
    document.body.appendChild(box);
  }

  /* Le bandeau s'affiche dès que <body> existe, sans attendre la fin du chargement des scripts de la page. */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-gads-manage]')) { e.preventDefault(); open(); }
  });
  function init() { if (!read()) open(); }
  if (document.body) init();
  else {
    var mo = new MutationObserver(function () { if (document.body) { mo.disconnect(); init(); } });
    mo.observe(document.documentElement, { childList: true });
  }
})();
