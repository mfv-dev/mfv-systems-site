// Outils communs pour la réservation d'un call : lecture de l'agenda Google MFV et création du rendez-vous.
// Connexion Google faite une seule fois avec le compte qui possède l'agenda (scripts/google-auth.js).
// Réglages à poser dans Vercel (Settings > Environment Variables) :
//   GCAL_CLIENT_ID, GCAL_CLIENT_SECRET   identifiant OAuth créé dans Google Cloud (projet MFV Site)
//   GCAL_REFRESH_TOKEN                   jeton obtenu par scripts/google-auth.js
//   GCAL_CALENDAR_ID                     (facultatif) agenda à utiliser, « primary » par défaut
// Tant que les trois premiers ne sont pas posés, les fonctions répondent 503 et le site renvoie vers la page démo.
const TZ = 'Europe/Paris';
const SLOT_MIN = 30;          // durée d'un créneau
const DAY_START = 9 * 60;     // 9h00
const DAY_END = 18 * 60;      // 18h00
const MIN_NOTICE_H = 24;      // à réserver au moins 24 h à l'avance
const HORIZON_DAYS = 30;      // jusqu'à 30 jours

function configured() {
  return Boolean(process.env.GCAL_CLIENT_ID && process.env.GCAL_CLIENT_SECRET && process.env.GCAL_REFRESH_TOKEN);
}
const calId = () => process.env.GCAL_CALENDAR_ID || 'primary';

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

/* Accès Google (jeton renouvelable) */
let token = null;
async function accessToken() {
  if (token && token.exp > Date.now() + 60000) return token.value;
  const body = new URLSearchParams({ client_id: process.env.GCAL_CLIENT_ID, client_secret: process.env.GCAL_CLIENT_SECRET, refresh_token: process.env.GCAL_REFRESH_TOKEN, grant_type: 'refresh_token' });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
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
  const id = calId();
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
async function createEvent(startMs, summary, description, attendee) {
  const id = encodeURIComponent(calId());
  return gfetch('https://www.googleapis.com/calendar/v3/calendars/' + id + '/events?conferenceDataVersion=1&sendUpdates=all', {
    method: 'POST',
    body: JSON.stringify({
      summary, description,
      start: { dateTime: new Date(startMs).toISOString(), timeZone: TZ },
      end: { dateTime: new Date(startMs + SLOT_MIN * 60000).toISOString(), timeZone: TZ },
      attendees: attendee ? [{ email: attendee.email, displayName: attendee.name }] : undefined,
      conferenceData: { createRequest: { requestId: 'mfv-' + startMs + '-' + Math.random().toString(36).slice(2, 8), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      reminders: { useDefault: true },
    }),
  });
}
module.exports = { configured, candidateSlots, freeSlots, createEvent, parisParts, parisToUtc, SLOT_MIN, TZ };
