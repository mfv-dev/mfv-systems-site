// Reçoit l'adresse e-mail saisie sur l'accueil et la transmet à la boîte MFV.
// Réglages à poser dans Vercel (Settings > Environment Variables) :
//   SMTP_HOST, SMTP_PORT (465 par défaut), SMTP_USER, SMTP_PASS, LEAD_TO (contact@mfv-systems.fr par défaut)
// Tant que SMTP_HOST, SMTP_USER et SMTP_PASS ne sont pas posés, la fonction répond 503 et le site affiche un message honnête.
const nodemailer = require('nodemailer');

const hits = new Map();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  // Champ piège : un humain ne le voit pas, un robot le remplit.
  if (body.website || body.botcheck) return res.status(200).json({ ok: true });

  const email = String(body.email || '').trim().slice(0, 254);
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'email' });

  // Champs facultatifs du formulaire de la page Contact (l'accueil n'envoie que l'e-mail).
  const clean = (v, n) => String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);
  const name = clean(body.name, 120);
  const hotel = clean(body.hotel, 160);
  const phone = clean(body.phone, 40);
  const situation = clean(body.situation, 160);
  const message = String(body.message || '').trim().slice(0, 4000);
  const isContact = Boolean(name || hotel || message);

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnue';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600 * 1000);
  if (recent.length >= 5) return res.status(429).json({ error: 'rate' });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEAD_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return res.status(503).json({ error: 'not_configured' });
  }

  try {
    const port = Number(SMTP_PORT || 465);
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    const lines = isContact
      ? [
          'Message reçu depuis la page Contact du site.',
          '',
          'Nom : ' + (name || '-'),
          'Établissement : ' + (hotel || '-'),
          'E-mail : ' + email,
          'Téléphone : ' + (phone || '-'),
          'Situation : ' + (situation || '-'),
          '',
          'Message :',
          message || '-',
          '',
          'Reçu le : ' + new Date().toISOString(),
        ]
      : [
          'Une personne souhaite être recontactée.',
          '',
          'E-mail : ' + email,
          'Reçu le : ' + new Date().toISOString(),
          'Page : accueil',
        ];
    await transport.sendMail({
      from: '"Site MFV Systems" <' + SMTP_USER + '>',
      to: LEAD_TO || 'contact@mfv-systems.fr',
      replyTo: email,
      subject: isContact
        ? 'Nouveau message depuis le site MFV Systems' + (hotel ? ' (' + hotel + ')' : '')
        : 'Nouveau contact depuis le site MFV Systems',
      text: lines.join('\n') + '\n',
    });
    recent.push(now);
    hits.set(ip, recent);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Envoi du contact impossible', e && e.code);
    return res.status(500).json({ error: 'send' });
  }
};
