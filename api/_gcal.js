// Outils communs pour la réservation d'un call : lecture de l'agenda Google MFV et création du rendez-vous.
// Réglages à poser dans Vercel (Settings > Environment Variables) :
//   GCAL_CLIENT_EMAIL  adresse du « compte de service » Google (finit par .iam.gserviceaccount.com)
//   GCAL_PRIVATE_KEY   clé privée de ce compte (champ private_key du fichier JSON)
//   GCAL_CALENDAR_ID   agenda à utiliser (en général l'adresse Google de l'agenda partagé)
//   GCAL_MEET_URL      (facultatif) lien de visioconférence permanent à indiquer dans les e-mails
// Tant que les trois premiers ne sont pas posés, les fonctions répondent 503 et le site renvoie vers la page démo.
const crypto = require('crypto');

const TZ = 'Europe/Paris';
const SLOT_MIN = 30;          // durée d'un créneau
const DAY_START = 9 * 60;     // 9h00
const DAY_END = 18 * 60;      // 18h00
const MIN_NOTICE_H = 24;      // à réserver au moins 24 h à l'avance
const HORIZON_DAYS = 30;      // jusqu'à 30 jours

function configured() {
  return Boolean(process.env.GCAL_CLIENT_EMAIL && process.env.GCAL_PRIVATE_KEY && process.env.GCAL_CALENDAR_ID);
}

/* Heure de Paris <-> UTC, sans bibliothèque */
const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
function parisParts(ms) {
  const o = {};
  fmt.formatToParts(new Date(ms)).forEach((p) => { if (p.type !== 'literal') o[p.type] = +p.value; });
  return o;
}
function offsetMin(ms) {
  const p = parisParts(ms);
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 60000;
}
function parisToUtc(y, m, d, hh, mm) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let ms = guess - offsetMin(guess) * 60000;
  ms = guess - offsetMin(ms) * 60000;
  return ms;
}
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (y, m, d) => y + '-' + pad(m) + '-' + pad(d);

/* Tous les créneaux théoriques (avant retrait des plages occupées) */
function candidateSlots(nowMs) {
  const out = []; // { day, time, startMs }
  const t = parisParts(nowMs);
  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const dt = new Date(Date.UTC(t.year, t.month - 1, t.day + i));
    const dow = dt.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
    for (let mn = DAY_START; mn + SLOT_MIN <= DAY_END; mn += SLOT_MIN) {
      const startMs = parisToUtc(y, m, d, Math.floor(mn / 60), mn % 60);
      if (startMs < nowMs + MIN_NOTICE_H * 3600 * 1000) continue;
      out.push({ day: dayKey(y, m, d), time: pad(Math.floor(mn / 60)) + ':' + pad(mn % 60), startMs });
    }
  }
  return out;
}

/* Accès Google (compte de service, jeton signé RS256) */
let token = null;
const b64 = (b) => Buffer.from(b).toString('base64url');
async function accessToken() {
  if (token && token.exp > Date.now() + 60000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64(JSON.stringify({ iss: process.env.GCAL_CLIENT_EMAIL, scope: 'https://www.googleapis.com/auth/calendar', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(process.env.GCAL_PRIVATE_KEY.replace(/\\n/g, '\n'), 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + head + '.' + claim + '.' + sig });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error('token ' + r.status);
  token = { value: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return token.value;
}
async function gfetch(url, opts) {
  const r = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + (await accessToken()), 'Content-Type': 'application/json' }, opts && opts.headers) }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('google ' + r.status);
  return j;
}
async function busy(fromMs, toMs) {
  const id = process.env.GCAL_CALENDAR_ID;
  const j = await gfetch('https://www.googleapis.com/calendar/v3/freeBusy', { method: 'POST', body: JSON.stringify({ timeMin: new Date(fromMs).toISOString(), timeMax: new Date(toMs).toISOString(), timeZone: TZ, items: [{ id }] }) });
  const c = j.calendars && j.calendars[id];
  if (!c || (c.errors && c.errors.length)) throw new Error('freebusy');
  return (c.busy || []).map((b) => [Date.parse(b.start), Date.parse(b.end)]);
}
/* Créneaux réellement libres, regroupés par jour */
async function freeSlots(nowMs) {
  const cand = candidateSlots(nowMs);
  if (!cand.length) return { days: {}, slots: [] };
  const b = await busy(cand[0].startMs, cand[cand.length - 1].startMs + SLOT_MIN * 60000);
  const free = cand.filter((s) => !b.some(([a, z]) => s.startMs < z && s.startMs + SLOT_MIN * 60000 > a));
  const days = {};
  free.forEach((s) => { (days[s.day] = days[s.day] || []).push(s.time); });
  return { days, slots: free };
}
async function createEvent(startMs, summary, description) {
  const id = encodeURIComponent(process.env.GCAL_CALENDAR_ID);
  return gfetch('https://www.googleapis.com/calendar/v3/calendars/' + id + '/events', {
    method: 'POST',
    body: JSON.stringify({
      summary, description,
      location: process.env.GCAL_MEET_URL || undefined,
      start: { dateTime: new Date(startMs).toISOString(), timeZone: TZ },
      end: { dateTime: new Date(startMs + SLOT_MIN * 60000).toISOString(), timeZone: TZ },
      reminders: { useDefault: true },
    }),
  });
}
module.exports = { configured, candidateSlots, freeSlots, createEvent, parisParts, parisToUtc, SLOT_MIN, TZ };
