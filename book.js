/* Réservation d'un call depuis le hero : créneaux lus dans l'agenda Google MFV via /api/slots, rendez-vous créé via /api/book. */
(function () {
  var root = document.getElementById('bk-b');
  if (!root) return;
  var days = null, month = null, picked = null, started = false;
  /* Aperçu du design : uniquement en local (localhost), avec des créneaux d'exemple. Absent du vrai site. */
  var PREVIEW = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !/[?&]live=1/.test(location.search);
  function sampleDays() {
    var o = {}, t = new Date();
    for (var i = 1; i <= 35; i++) {
      var d = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate() + i)), w = d.getUTCDay();
      if (w === 0 || w === 6) continue;
      var times = [];
      for (var h = 9; h < 18; h++) { times.push(pad(h) + ':00'); times.push(pad(h) + ':30'); }
      if (d.getUTCDate() % 3 === 0) times = times.slice(0, 5);
      if (d.getUTCDate() % 5 === 0) times = times.filter(function (x, k) { return k % 3 !== 0; });
      o[key(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())] = times;
    }
    return o;
  }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var dFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
  var mFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  var key = function (y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); };
  var parse = function (k) { var p = k.split('-'); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; };
  var dateOf = function (k) { var p = parse(k); return new Date(Date.UTC(p.y, p.m, p.d)); };

  function fallback(msg) {
    root.innerHTML = '<p class="bk-note">' + esc(msg || 'La réservation en ligne est momentanément indisponible.') + ' <a href="/demo">Choisir un créneau</a> ou écrire à <a href="mailto:contact@mfv-systems.fr">contact@mfv-systems.fr</a>.</p>';
  }

  function viewCalendar() {
    var keys = Object.keys(days).sort();
    if (!keys.length) return fallback('Aucun créneau disponible pour le moment.');
    if (!month) { var f = parse(keys[0]); month = { y: f.y, m: f.m }; }
    if (!picked || !days[picked]) picked = keys.filter(function (k) { var p = parse(k); return p.y === month.y && p.m === month.m; })[0] || keys[0];
    var first = new Date(Date.UTC(month.y, month.m, 1)), lead = (first.getUTCDay() + 6) % 7, nb = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
    var fm = parse(keys[0]), lm = parse(keys[keys.length - 1]);
    var canPrev = month.y * 12 + month.m > fm.y * 12 + fm.m, canNext = month.y * 12 + month.m < lm.y * 12 + lm.m;
    var cells = '';
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (l) { cells += '<i aria-hidden="true">' + l + '</i>'; });
    for (var i = 0; i < lead; i++) cells += '<span></span>';
    for (var d = 1; d <= nb; d++) {
      var k = key(month.y, month.m, d);
      cells += days[k]
        ? '<button type="button" data-day="' + k + '" aria-pressed="' + (k === picked) + '" aria-label="' + esc(dFmt.format(dateOf(k))) + '">' + d + '</button>'
        : '<span>' + d + '</span>';
    }
    var slots = (days[picked] || []).map(function (t) { return '<button type="button" data-time="' + t + '">' + t + '</button>'; }).join('');
    root.innerHTML =
      '<div class="bk-nav"><button type="button" data-nav="-1" aria-label="Mois précédent"' + (canPrev ? '' : ' disabled') + '>&#8249;</button><b>' + esc(mFmt.format(first)) + '</b><button type="button" data-nav="1" aria-label="Mois suivant"' + (canNext ? '' : ' disabled') + '>&#8250;</button></div>' +
      '<div class="bk-grid">' + cells + '</div>' +
      '<p class="bk-day">' + esc(dFmt.format(dateOf(picked))) + ' · heure de Paris</p>' +
      '<div class="bk-slots">' + slots + '</div>';
  }

  function viewForm(time) {
    root.innerHTML =
      '<button type="button" class="bk-back" data-back>&#8592; Changer de créneau</button>' +
      '<div class="bk-sum">' + esc(dFmt.format(dateOf(picked))) + ' à ' + esc(time) + ' · 30 min</div>' +
      '<form class="bk-form" novalidate><label class="hp" aria-hidden="true">Ne pas remplir<input type="text" name="website" tabindex="-1" autocomplete="off"></label>' +
      '<input type="text" name="name" placeholder="Nom et prénom" aria-label="Nom et prénom" autocomplete="name" required>' +
      '<input type="email" name="email" placeholder="Email professionnel" aria-label="Email professionnel" autocomplete="email" required>' +
      '<input type="text" name="hotel" placeholder="Établissement (facultatif)" aria-label="Établissement" autocomplete="organization">' +
      '<button type="submit">Confirmer le rendez-vous</button><div class="bk-msg" role="status"></div></form>';
    var f = root.querySelector('form'), msg = root.querySelector('.bk-msg'), btn = f.querySelector('button[type=submit]');
    f.name.focus({ preventScroll: true });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.name.value.trim()) { msg.textContent = 'Merci de saisir votre nom.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) { msg.textContent = 'Merci de saisir une adresse e-mail valide.'; return; }
      btn.disabled = true; msg.textContent = 'Réservation en cours...';
      if (PREVIEW) { return setTimeout(function () { viewDone({ when: dFmt.format(dateOf(picked)) + ' à ' + time, mailed: true }, f.email.value.trim()); }, 600); }
      fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day: picked, time: time, name: f.name.value, email: f.email.value, hotel: f.hotel.value, website: f.website.value }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { st: r.status, j: j }; }); })
        .then(function (x) {
          if (x.st === 200) return viewDone(x.j, f.email.value.trim());
          btn.disabled = false;
          if (x.st === 409) { msg.textContent = 'Ce créneau vient d\'être pris. Choisissez-en un autre.'; load(true); }
          else if (x.st === 429) msg.textContent = 'Trop de tentatives, réessayez dans quelques minutes.';
          else msg.textContent = 'La réservation a échoué. Écrivez-nous à contact@mfv-systems.fr.';
        })
        .catch(function () { btn.disabled = false; msg.textContent = 'Connexion impossible. Écrivez-nous à contact@mfv-systems.fr.'; });
    });
  }

  function viewDone(j, email) {
    root.innerHTML = '<div class="bk-done"><div class="ok" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5l4 4 8-9"/></svg></div>' +
      '<h3>C\'est confirmé.</h3><p><b>' + esc(j.when || '') + '</b> (heure de Paris).</p>' +
      '<p style="margin-top:8px">' + (j.mailed ? 'Une invitation, avec le lien de visioconférence, vient d\'être envoyée à ' + esc(email) + '.' : 'Nous vous confirmons le rendez-vous par e-mail.') + '</p></div>';
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || !days) return;
    if (t.dataset.nav) { month.m += +t.dataset.nav; if (month.m < 0) { month.m = 11; month.y--; } if (month.m > 11) { month.m = 0; month.y++; } picked = null; viewCalendar(); }
    else if (t.dataset.day) { picked = t.dataset.day; viewCalendar(); }
    else if (t.dataset.time) viewForm(t.dataset.time);
    else if (t.hasAttribute('data-back')) viewCalendar();
  });

  function load(quiet) {
    if (PREVIEW) { days = sampleDays(); if (!quiet) { month = null; picked = null; } viewCalendar(); return; }
    fetch('/api/slots', { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { days = j.days || {}; if (!quiet) { month = null; picked = null; } viewCalendar(); })
      .catch(function () { fallback(); });
  }
  window.MFVBook = { start: function () { if (started) return; started = true; load(); } };
})();
