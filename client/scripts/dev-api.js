/**
 * Local dev API shim — zero dependencies.
 * Serves the /api/content/* serverless handlers on http://localhost:3001 so the
 * admin content editor can be tested locally exactly as it runs on Vercel.
 * Also stubs GET /api/leads so the existing admin login works without Neon.
 *
 * Run:  node scripts/dev-api.js   (from client/)
 * Reads client/.env for GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH, ADMIN_SECRET.
 *
 * Production uses the real Vercel functions — this shim is dev-only.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

// ── Load client/.env into process.env (no dotenv dependency) ────────────────
try {
  const envPath = fileURLToPath(new URL('../.env', import.meta.url));
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  console.warn('dev-api: no .env found — set env vars manually');
}

const state = (await import('../api/content/state.js')).default;
const blob = (await import('../api/content/blob.js')).default;
const publish = (await import('../api/content/publish.js')).default;

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Adapt Node res to the Vercel handler API (res.status().json()).
function adapt(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

const server = createServer(async (req, res) => {
  adapt(res);
  const path = req.url.split('?')[0];

  if (req.method !== 'GET') req.body = await readBody(req);

  try {
    if (path === '/api/content/state') return await state(req, res);
    if (path === '/api/content/blob') return await blob(req, res);
    if (path === '/api/content/publish') return await publish(req, res);

    // Stub the leads endpoint so the admin login gate passes locally.
    if (path === '/api/leads') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
      res.setHeader('Vary', 'Origin');
      if (req.method === 'OPTIONS') return res.status(200).end();
      if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json({ leads: [], total: 0, page: 1, pageSize: 20 });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

const PORT = 3001;
server.listen(PORT, () => console.log(`dev-api shim on http://localhost:${PORT}`));
