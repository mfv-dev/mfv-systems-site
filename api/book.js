// Réserve un créneau : crée le rendez-vous dans l'agenda Google MFV et envoie les e-mails de confirmation.
const nodemailer = require('nodemailer');
const { configured, freeSlots, createEvent, SLOT_MIN } = require('./_gcal');

const hits = new Map();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, n) => String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);

function ics(startMs, summary, description, uid, location) {
  const f = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MFV Systems//Demo//FR', 'METHOD:REQUEST', 'BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + f(Date.now()),
    'DTSTART:' + f(startMs), 'DTEND:' + f(startMs + SLOT_MIN * 60000), 'SUMMARY:' + summary, 'DESCRIPTION:' + description.replace(/\n/g, '\\n'),
    location ? 'LOCATION:' + location : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method' }); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  if (body.website) return res.status(200).json({ ok: true });

  const name = clean(body.name, 120), hotel = clean(body.hotel, 160), email = clean(body.email, 254);
  const day = clean(body.day, 10), time = clean(body.time, 5);
  if (!name) return res.status(400).json({ error: 'name' });
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'email' });
  if (!configured()) return res.status(503).json({ error: 'not_configured' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnue';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600 * 1000);
  if (recent.length >= 5) return res.status(429).json({ error: 'rate' });

  try {
    // Le créneau demandé doit être, à cet instant, un vrai créneau libre.
    const { slots } = await freeSlots(now);
    const slot = slots.find((s) => s.day === day && s.time === time);
    if (!slot) return res.status(409).json({ error: 'taken' });

    const when = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(slot.startMs));
    const meet = process.env.GCAL_MEET_URL || '';
    const summary = 'Démo MFV Systems · ' + name + (hotel ? ' (' + hotel + ')' : '');
    const description = ['Réservé depuis le site mfv-systems.fr', '', 'Nom : ' + name, 'Établissement : ' + (hotel || '-'), 'E-mail : ' + email].join('\n');
    const ev = await createEvent(slot.startMs, summary, description);
    recent.push(now); hits.set(ip, recent);

    // E-mails (facultatifs : le rendez-vous est déjà dans l'agenda)
    let mailed = false;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEAD_TO } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        const port = Number(SMTP_PORT || 465);
        const tr = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
        const visio = meet ? 'Lien de visioconférence : ' + meet : 'Le lien de visioconférence vous sera envoyé avant le rendez-vous.';
        await tr.sendMail({
          from: '"MFV Systems" <' + SMTP_USER + '>', to: email, replyTo: LEAD_TO || SMTP_USER,
          subject: 'Votre rendez-vous avec MFV Systems : ' + when,
          text: ['Bonjour ' + name + ',', '', 'Votre rendez-vous de ' + SLOT_MIN + ' minutes avec MFV Systems est confirmé : ' + when + ' (heure de Paris).', visio, '', 'Pour le déplacer ou l\'annuler, répondez simplement à ce message.', '', 'À bientôt,', 'MFV Systems'].join('\n'),
          icalEvent: { method: 'REQUEST', content: ics(slot.startMs, 'Démo MFV Systems', 'Rendez-vous avec MFV Systems.', ev.id || String(slot.startMs), meet) },
        });
        await tr.sendMail({
          from: '"Site MFV Systems" <' + SMTP_USER + '>', to: LEAD_TO || 'contact@mfv-systems.fr', replyTo: email,
          subject: 'Nouveau rendez-vous : ' + name + ' · ' + when,
          text: ['Un rendez-vous vient d\'être réservé sur le site.', '', 'Quand : ' + when + ' (heure de Paris)', 'Nom : ' + name, 'Établissement : ' + (hotel || '-'), 'E-mail : ' + email].join('\n'),
        });
        mailed = true;
      } catch (e) { console.error('E-mail de confirmation impossible', e && e.code); }
    }
    return res.status(200).json({ ok: true, when, mailed });
  } catch (e) {
    console.error('Réservation impossible', e && e.message);
    return res.status(502).json({ error: 'calendar' });
  }
};
