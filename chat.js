/* Assistant MFV : bulle flottante + fenêtre de conversation.
   Aperçu du design en local (localhost) avec des réponses d'exemple. Absent du vrai site tant que /api/chat n'est pas branché. */
(function () {
  var PREVIEW = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !/[?&]live=1/.test(location.search);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var started = false, open = false, busy = false, history = [];
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var SUGGEST = ['Combien coûtent les OTA ?', 'Que fait MFV Book ?', 'Mes outils actuels restent-ils ?'];
  var OTA = 'En moyenne, les hôtels reversent 17 % de commission à chaque réservation passée par une OTA (moyenne observée par Coach Omnium). Le simulateur plus bas sur la page estime ce que cela représente pour votre hôtel.';
  var BOOK = 'MFV Book est le moteur de réservation directe intégré à votre site. Le voyageur réserve et paie chez vous, les fonds vont directement sur votre compte et la réservation arrive dans votre PMS. Aucune commission MFV.';
  var TOOLS = 'Oui, lorsque l\'intégration est compatible : MFV vous accompagne de la visibilité en ligne à la gestion quotidienne, sans bouleverser vos outils existants.';
  /* Réponses d'exemple (aperçu local seulement), faites uniquement de faits déjà présents sur le site */
  var SAMPLE = [
    [/^\s*(hello|bonjour|bonsoir|salut|hey|coucou)\b/i, 'Bonjour ! Je peux vous renseigner sur nos produits, la réservation directe ou les commissions des plateformes. Que voulez-vous savoir ?', false],
    [/combien co[uû]tent les ota|commission|ota|booking|expedia/i, OTA, false],
    [/mfv book|moteur|r[ée]servation directe|r[ée]server en direct/i, BOOK, false],
    [/outils|existant|int[ée]gr|compatible|pms actuel/i, TOOLS, false],
    [/stay|pms|planning|gestion/i, 'MFV Stay est le PMS pensé pour les hôtels indépendants : le planning, les clients et les paiements au même endroit, et chacun voit ce qui le concerne.', false],
    [/studio|site web|site internet|identit|photo|vid[ée]o|design/i, 'MFV Studio crée des sites et des expériences digitales sur mesure : création de sites web, identité de marque, photographie et vidéo, pour les hôtels et pour d\'autres métiers.', false],
    [/insight|seo|r[ée]f[ée]rencement|google|analytics|panier/i, 'MFV Insight vous aide à comprendre votre performance et à développer vos réservations directes : parcours de réservation, paniers abandonnés, référencement et acquisition.', false],
    [/macron|loi/i, 'Depuis la loi Macron de 2015, l\'hôtelier est libre de proposer sur son propre site des tarifs inférieurs à ceux des plateformes. Réserver en direct devient un vrai avantage, pour votre client comme pour vous.', false],
    [/prix|tarif|co[uû]t|devis|abonnement/i, 'Les tarifs dépendent de votre établissement et de vos besoins. Le plus simple est d\'en parler avec l\'équipe lors d\'un call de 30 minutes, sans engagement.', true]
  ];
  var FALLBACK = 'Je n\'ai pas cette information avec certitude. Le mieux est d\'en parler avec l\'équipe lors d\'un call de 30 minutes, sans engagement.';
  function sampleAnswer(q) {
    for (var i = 0; i < SAMPLE.length; i++) if (SAMPLE[i][0].test(q)) return { text: SAMPLE[i][1], cta: SAMPLE[i][2] };
    return { text: FALLBACK, cta: true };
  }

  var root = document.createElement('div');
  root.className = 'ai';
  root.innerHTML =
    '<section class="ai-panel" id="ai-panel" role="dialog" aria-label="Assistant MFV" aria-hidden="true" data-lenis-prevent>' +
      '<header class="ai-h"><div class="ai-t"><span class="ai-dot" aria-hidden="true"></span><div><b>Assistant MFV</b><small>' + (PREVIEW ? 'Aperçu du design, réponses d\'exemple' : 'IA, répond à partir de nos contenus') + '</small></div></div>' +
      '<button type="button" class="ai-x" aria-label="Fermer l\'assistant">&times;</button></header>' +
      '<div class="ai-log" id="ai-log" aria-live="polite"></div>' +
      '<div class="ai-sg" id="ai-sg"></div>' +
      '<form class="ai-f" id="ai-f" autocomplete="off"><input type="text" id="ai-in" placeholder="Posez votre question" aria-label="Votre question" maxlength="400"><button type="submit" aria-label="Envoyer"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg></button></form>' +
      '<p class="ai-n">Réponses générées par une IA à partir de notre site. Pour un conseil précis, <a href="/demo">réservez un call</a>.</p>' +
    '</section>' +
    '<button type="button" class="ai-b" id="ai-b" aria-expanded="false" aria-controls="ai-panel"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z"/><path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" opacity=".7"/></svg><span>Une question ?</span></button>';

  var $ = function (id) { return root.querySelector('#' + id); };
  var panel, log, sg, form, input, bubble;

  function add(role, html) {
    var d = document.createElement('div'); d.className = 'ai-m ' + role; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function suggestions(show) {
    sg.innerHTML = show ? SUGGEST.map(function (q) { return '<button type="button">' + esc(q) + '</button>'; }).join('') : '';
  }
  function greet() {
    add('bot', 'Bonjour, je réponds à vos questions sur MFV : produits, fonctionnement, commissions. Que voulez-vous savoir ?');
    suggestions(true);
  }
  function typeInto(el, text, done) {
    if (reduce) { el.textContent = text; log.scrollTop = log.scrollHeight; return done(); }
    var words = text.split(' '), i = 0; el.textContent = '';
    (function step() { el.textContent += (i ? ' ' : '') + words[i++]; log.scrollTop = log.scrollHeight; if (i < words.length) setTimeout(step, 28); else done(); })();
  }
  function ask(q) {
    q = q.trim(); if (!q || busy) return;
    busy = true; suggestions(false); input.value = '';
    add('me', esc(q)); history.push({ role: 'user', content: q });
    var typing = add('bot typing', '<i></i><i></i><i></i>');
    var finish = function (text, cta) {
      typing.className = 'ai-m bot'; typing.innerHTML = '';
      typeInto(typing, text, function () {
        history.push({ role: 'assistant', content: text });
        if (cta) add('cta', '<a href="#top" class="ai-c">Réserver un call</a>');
        busy = false; input.focus();
      });
    };
    if (PREVIEW) {
      setTimeout(function () { var a = sampleAnswer(q); finish(a.text, a.cta); }, 900);
      return;
    }
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-10) }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { finish(j.reply || 'Je n\'ai pas de réponse pour le moment.', !!j.cta); })
      .catch(function () { finish('Je ne peux pas répondre pour le moment. Écrivez-nous à contact@mfv-systems.fr ou réservez un call.', true); });
  }
  function setOpen(o) {
    open = o; root.classList.toggle('open', o); panel.setAttribute('aria-hidden', String(!o)); bubble.setAttribute('aria-expanded', String(o));
    if (o) { if (!log.children.length) greet(); setTimeout(function () { input.focus({ preventScroll: true }); }, 250); } else bubble.focus({ preventScroll: true });
  }

  window.MFVChat = { start: function () {
    if (started) return; started = true;
    document.body.appendChild(root);
    panel = $('ai-panel'); log = $('ai-log'); sg = $('ai-sg'); form = $('ai-f'); input = $('ai-in'); bubble = $('ai-b');
    bubble.addEventListener('click', function () { setOpen(!open); });
    root.querySelector('.ai-x').addEventListener('click', function () { setOpen(false); });
    sg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) ask(b.textContent); });
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });
    root.addEventListener('click', function (e) { if (e.target.closest('.ai-c')) setOpen(false); });
    requestAnimationFrame(function () { root.classList.add('on'); });
  } };
})();
