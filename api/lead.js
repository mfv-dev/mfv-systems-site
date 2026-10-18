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
  if (body.website) return res.status(200).json({ ok: true });

  const email = String(body.email || '').trim().slice(0, 254);
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'email' });

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
    await transport.sendMail({
      from: '"Site MFV Systems" <' + SMTP_USER + '>',
      to: LEAD_TO || 'contact@mfv-systems.fr',
      replyTo: email,
      subject: 'Nouveau contact depuis le site MFV Systems',
      text: 'Une personne souhaite être recontactée.\n\nE-mail : ' + email + '\nReçu le : ' + new Date().toISOString() + '\nPage : accueil\n',
    });
    recent.push(now);
    hits.set(ip, recent);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Envoi du contact impossible', e && e.code);
    return res.status(500).json({ error: 'send' });
  }
};
