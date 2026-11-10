// Réserve un créneau : crée le rendez-vous dans l'agenda Google MFV et envoie les e-mails de confirmation.
const nodemailer = require('nodemailer');
const { configured, freeSlots, createEvent, SLOT_MIN } = require('./_gcal');

const hits = new Map();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, n) => String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);

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
    const summary = 'Démo MFV Systems · ' + name + (hotel ? ' (' + hotel + ')' : '');
    const description = ['Réservé depuis le site mfv-systems.fr', '', 'Nom : ' + name, 'Établissement : ' + (hotel || '-'), 'E-mail : ' + email].join('\n');
    const ev = await createEvent(slot.startMs, summary, description, { email, name });
    const meet = ev.hangoutLink || '';
    recent.push(now); hits.set(ip, recent);

    // Google envoie l'invitation (avec le lien Meet) au visiteur. L'équipe reçoit en plus une notification (facultative).
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEAD_TO } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        const port = Number(SMTP_PORT || 465);
        const tr = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
        await tr.sendMail({
          from: '"Site MFV Systems" <' + SMTP_USER + '>', to: LEAD_TO || 'contact@mfv-systems.fr', replyTo: email,
          subject: 'Nouveau rendez-vous : ' + name + ' · ' + when,
          text: ['Un rendez-vous vient d\'être réservé sur le site.', '', 'Quand : ' + when + ' (heure de Paris)', 'Nom : ' + name, 'Établissement : ' + (hotel || '-'), 'E-mail : ' + email, meet ? 'Visio : ' + meet : ''].join('\n'),
        });
      } catch (e) { console.error('Notification impossible', e && e.code); }
    }
    const mailed = true;
    return res.status(200).json({ ok: true, when, mailed });
  } catch (e) {
    console.error('Réservation impossible', e && e.message);
    return res.status(502).json({ error: 'calendar' });
  }
};
