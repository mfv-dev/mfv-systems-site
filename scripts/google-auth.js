// Connexion Google à faire UNE fois, avec le compte qui possède l'agenda des rendez-vous.
// Usage : node scripts/google-auth.js chemin/vers/client_secret.json
// Ouvre le navigateur, demande l'autorisation, puis écrit le jeton dans ~/.mfv-gcal.env (jamais affiché ni versionné).
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const file = process.argv[2];
if (!file) { console.error('Usage : node scripts/google-auth.js client_secret.json'); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const c = raw.web || raw.installed;
const redirect = 'http://localhost:8765/oauth';
const scope = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.freebusy'].join(' ');
const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: c.client_id, redirect_uri: redirect, response_type: 'code', scope, access_type: 'offline', prompt: 'consent' });

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:8765');
  if (u.pathname !== '/oauth') { res.writeHead(404); return res.end(); }
  const code = u.searchParams.get('code');
  if (!code) { res.end('Autorisation refusée.'); return process.exit(1); }
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: c.client_id, client_secret: c.client_secret, redirect_uri: redirect, grant_type: 'authorization_code' }) });
  const j = await r.json();
  if (!j.refresh_token) { res.end('Pas de jeton reçu : ' + (j.error || 'inconnu')); console.error('Échec', j.error); return process.exit(1); }
  const out = path.join(os.homedir(), '.mfv-gcal.env');
  fs.writeFileSync(out, 'GCAL_CLIENT_ID=' + c.client_id + '\nGCAL_CLIENT_SECRET=' + c.client_secret + '\nGCAL_REFRESH_TOKEN=' + j.refresh_token + '\n', { mode: 0o600 });
  res.end('C\'est fait, vous pouvez fermer cette page.');
  console.log('Jeton enregistré dans ' + out);
  process.exit(0);
}).listen(8765, () => { console.log('Ouverture du navigateur...'); try { execSync('open "' + url + '"'); } catch (e) { console.log(url); } });
