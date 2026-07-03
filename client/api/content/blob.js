import { setCors } from '../_lib/security.js';
import { requireAdmin, validateBlob } from '../_lib/content.js';
import { createBlob } from '../_lib/github.js';

// POST /api/content/blob { path, base64 } → { path, sha }
// Uploads ONE media file as a git blob (each request stays well under Vercel's
// body limit). The returned sha is later assembled into a single atomic commit
// by /api/content/publish.
export default async function handler(req, res) {
  if (setCors(req, res, 'POST, OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  const file = req.body || {};
  const err = validateBlob(file);
  if (err) return res.status(400).json({ error: err });

  try {
    const sha = await createBlob(file.base64, 'base64');
    res.status(200).json({ path: file.path, sha });
  } catch (e) {
    res.status(502).json({ error: 'העלאת הקובץ נכשלה: ' + e.message });
  }
}
