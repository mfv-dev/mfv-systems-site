// Reçoit les leads des formulaires Google Ads (webhook) et les transmet par e-mail à la boîte MFV.
// Réglages à poser dans Vercel (Settings > Environment Variables) :
//   GOOGLE_LEAD_KEY                      clé saisie dans Google Ads (champ « Clé »), à garder secrète
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEAD_TO   les mêmes que pour /api/lead
// Google réessaie tant qu'il ne reçoit pas un 200 : une fois la clé validée, on répond toujours 200, même si l'e-mail échoue.
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, n) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, n);

function sameKey(given, expected) {
  if (!expected || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

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

  if (!sameKey(body.google_key, process.env.GOOGLE_LEAD_KEY)) return res.status(403).json({ error: 'key' });

  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEAD_TO } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error('smtp non configuré');

    const isTest = body.is_test === true || body.is_test === 'true';
    const cols = Array.isArray(body.user_column_data) ? body.user_column_data : [];
    const fields = cols.map((c) => ({
      id: clean(c && c.column_id, 60),
      label: clean((c && (c.column_name || c.column_id)) || 'Champ', 120),
      value: clean(c && c.string_value, 1000),
    }));
    const mail = (fields.find((f) => f.id === 'EMAIL') || {}).value || '';

    const lines = ['Un lead vient d\'être reçu depuis un formulaire Google Ads.', ''];
    fields.forEach((f) => lines.push(f.label + ' : ' + (f.value || '-')));
    lines.push('', 'Lead : ' + (clean(body.lead_id, 200) || '-'), 'Campagne : ' + (clean(body.campaign_id, 60) || '-'), 'Reçu le : ' + new Date().toISOString());

    const port = Number(SMTP_PORT || 465);
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await transport.sendMail({
      from: '"Site MFV Systems" <' + SMTP_USER + '>',
      to: LEAD_TO || 'contact@mfv-systems.fr',
      replyTo: EMAIL.test(mail) ? mail : undefined,
      subject: (isTest ? '[TEST] ' : '') + 'Nouveau lead Google Ads',
      text: lines.join('\n') + '\n',
    });
  } catch (e) {
    console.error('Lead Google Ads : envoi impossible', e && (e.code || e.message), 'lead', clean(body.lead_id, 80));
  }
  return res.status(200).json({});
};
