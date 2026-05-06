/**
 * Shared security utilities for Vercel API routes
 * ─────────────────────────────────────────────────
 * • setCors()          — restrict CORS to known origins only
 * • getClientIp()      — extract real IP from Vercel headers
 * • checkAdminLimit()  — in-memory brute-force guard for admin endpoints
 * • recordAdminFail()  — record a failed admin auth attempt
 */

// ── Allowed origins ─────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  'https://www.taljacoby.co.il',
  'https://taljacoby.co.il',
  'http://localhost:5173',   // local Vite dev
  'http://localhost:4173',   // local Vite preview
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // allow any Vercel preview deployment for this project
  if (/^https:\/\/tal-jacoby-[a-z0-9-]+-tals-projects[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/tal-jacoby-professional[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  return false;
}

/**
 * Set CORS headers and handle preflight.
 * Returns true if the request was a preflight (caller should return immediately).
 */
export function setCors(req, res, methods = 'GET, POST, OPTIONS') {
  const origin = req.headers.origin || '';
  const allowed = isAllowedOrigin(origin) ? origin : 'https://www.taljacoby.co.il';

  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // caller should return
  }
  return false;
}

// ── Client IP ───────────────────────────────────────────────────
export function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// ── Admin brute-force guard ─────────────────────────────────────
// Module-level store — persists across warm invocations of the same instance.
// Each instance is independent (serverless), but this stops scripted attacks
// that hit the same warm instance repeatedly.
const _adminFailures = new Map(); // ip → { count, windowStart }

const ADMIN_WINDOW_MS  = 15 * 60 * 1000; // 15-minute sliding window
const ADMIN_MAX_FAILS  = 15;              // max failed attempts before lockout

function _pruneExpired() {
  const now = Date.now();
  for (const [ip, rec] of _adminFailures) {
    if (now - rec.windowStart > ADMIN_WINDOW_MS) _adminFailures.delete(ip);
  }
}

/** Returns true if the IP is currently locked out. */
export function checkAdminLimit(ip) {
  _pruneExpired();
  const rec = _adminFailures.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.windowStart > ADMIN_WINDOW_MS) {
    _adminFailures.delete(ip);
    return false;
  }
  return rec.count >= ADMIN_MAX_FAILS;
}

/** Call this after a failed admin auth. */
export function recordAdminFail(ip) {
  const now = Date.now();
  const rec = _adminFailures.get(ip);
  if (!rec || now - rec.windowStart > ADMIN_WINDOW_MS) {
    _adminFailures.set(ip, { count: 1, windowStart: now });
  } else {
    rec.count += 1;
  }
}

/** Call this after a successful admin auth to reset the counter. */
export function clearAdminFails(ip) {
  _adminFailures.delete(ip);
}
