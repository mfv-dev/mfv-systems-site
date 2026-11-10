// Créneaux libres pour réserver un call (lecture de l'agenda Google MFV).
const { configured, freeSlots } = require('./_gcal');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'method' }); }
  if (!configured()) return res.status(503).json({ error: 'not_configured' });
  try {
    const { days } = await freeSlots(Date.now());
    return res.status(200).json({ timezone: 'Europe/Paris', duration: 30, days });
  } catch (e) {
    console.error('Lecture de l\'agenda impossible', e && e.message);
    return res.status(502).json({ error: 'calendar' });
  }
};
