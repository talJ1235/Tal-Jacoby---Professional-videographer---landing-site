/**
 * Content editor — shared auth + validation (Hebrew error messages).
 * Auth reuses the CRM scheme: x-admin-key must equal ADMIN_SECRET.
 */
import { getClientIp, checkAdminLimit, recordAdminFail, clearAdminFails } from './security.js';

export const MAX_FILE_BYTES = 3 * 1024 * 1024;   // 3MB per file
export const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15MB per publish
const CATEGORIES = ['events', 'business', 'aerial'];
const PATH_WHITELIST = [/^content\//, /^client\/public\/media\//];

/**
 * Verify the admin key with brute-force guard. Returns true if the request is
 * authorized; otherwise writes the proper 401/429 response and returns false.
 */
export function requireAdmin(req, res) {
  const ip = getClientIp(req);
  if (checkAdminLimit(ip)) {
    res.status(429).json({ error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.' });
    return false;
  }
  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
    recordAdminFail(ip);
    res.status(401).json({ error: 'הסיסמה שגויה.' });
    return false;
  }
  clearAdminFails(ip);
  return true;
}

export function isSafePath(p) {
  if (typeof p !== 'string' || !p) return false;
  if (p.includes('..') || p.includes('\\') || p.startsWith('/')) return false;
  return PATH_WHITELIST.some((re) => re.test(p));
}

// base64 decoded byte length (without allocating the buffer)
export function base64Bytes(b64) {
  if (typeof b64 !== 'string' || !b64) return 0;
  const len = b64.length;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

// Validates the works array. Returns an error string (Hebrew) or null if valid.
export function validateWorks(works) {
  if (!Array.isArray(works)) return 'רשימת העבודות אינה תקינה.';
  if (works.length === 0) return 'חייבת להיות לפחות עבודה אחת.';
  const ids = new Set();
  for (const w of works) {
    if (!w || typeof w !== 'object') return 'עבודה אחת אינה תקינה.';
    for (const f of ['id', 'title', 'tag', 'category', 'thumb', 'preview']) {
      if (typeof w[f] !== 'string' || !w[f].trim()) {
        return `בעבודה "${w.title || w.id || '—'}" חסר שדה חובה: ${f}.`;
      }
    }
    // id must be a filesystem/URL-safe slug (used in media paths + layout ids)
    if (!/^[a-z0-9][a-z0-9-]*$/.test(w.id)) {
      return `מזהה עבודה לא תקין: "${w.id}" (אותיות לטיניות קטנות, ספרות ומקפים בלבד).`;
    }
    if (!CATEGORIES.includes(w.category)) {
      return `בעבודה "${w.title}" קטגוריה לא תקינה (אירועים / עסקים / אווירי).`;
    }
    const yt = w.youtubeId ?? '';
    if (typeof yt !== 'string' || (yt !== '' && !/^[A-Za-z0-9_-]{11}$/.test(yt))) {
      return `בעבודה "${w.title}" מזהה יוטיוב לא תקין.`;
    }
    if (typeof w.published !== 'boolean') {
      return `בעבודה "${w.title}" חסר סטטוס פרסום.`;
    }
    if (ids.has(w.id)) return `מזהה כפול: ${w.id}.`;
    ids.add(w.id);
  }
  return null;
}

// Validates the site texts object. Returns an error string (Hebrew) or null.
export function validateSite(site) {
  if (!site || typeof site !== 'object') return 'הגדרות האתר אינן תקינות.';
  for (const f of ['heroName', 'heroSubtitle', 'seoTitle', 'seoDescription']) {
    if (typeof site[f] !== 'string' || !site[f].trim()) return `חסר שדה: ${f}.`;
  }
  const footer = site.footer || {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(footer.email || '')) {
    return 'כתובת אימייל בפוטר אינה תקינה.';
  }
  if (!/^\+?[0-9]{9,15}$/.test((footer.phone || '').replace(/[\s\-()]/g, ''))) {
    return 'מספר טלפון בפוטר אינו תקין.';
  }
  if (!/^https?:\/\//.test(footer.instagram || '')) {
    return 'קישור אינסטגרם בפוטר אינו תקין.';
  }
  return null;
}

// Validates a single blob upload (path + size). Returns an error string or null.
export function validateBlob(file) {
  if (!file || !isSafePath(file.path)) {
    return `נתיב קובץ לא מורשה: ${file && file.path ? file.path : '—'}.`;
  }
  if (typeof file.base64 !== 'string' || !file.base64) {
    return `קובץ ריק: ${file.path}.`;
  }
  if (base64Bytes(file.base64) > MAX_FILE_BYTES) {
    return `הקובץ ${file.path} גדול מדי (מעל 3MB).`;
  }
  return null;
}

// Validates paths referenced by a publish (pre-uploaded blobs + deletions).
export function validatePublishPaths(blobs = [], deletedPaths = []) {
  for (const b of blobs) {
    if (!b || !isSafePath(b.path)) return `נתיב קובץ לא מורשה: ${b && b.path ? b.path : '—'}.`;
    if (typeof b.sha !== 'string' || !/^[0-9a-f]{40}$/.test(b.sha)) {
      return `מזהה קובץ לא תקין עבור ${b.path}.`;
    }
  }
  for (const p of deletedPaths) {
    if (!isSafePath(p)) return `נתיב מחיקה לא מורשה: ${p}.`;
  }
  return null;
}
