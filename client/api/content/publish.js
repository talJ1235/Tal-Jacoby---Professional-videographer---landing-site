import { setCors } from '../_lib/security.js';
import { requireAdmin, validateSite, validateWorks, validatePublishPaths } from '../_lib/content.js';
import { commitChanges } from '../_lib/github.js';

// POST /api/content/publish
//   { siteJson, worksJson, blobs:[{path,sha}], deletedPaths:[], message }
// Assembles ONE atomic commit: site.json + works.json (inline) + the already
// uploaded media blobs, minus deletedPaths. Updates the deploy branch → Vercel
// rebuilds and the live site updates in ~2 minutes.
export default async function handler(req, res) {
  if (setCors(req, res, 'POST, OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  const { siteJson, worksJson, blobs = [], deletedPaths = [], message } = req.body || {};

  const sErr = validateSite(siteJson);
  if (sErr) return res.status(400).json({ error: sErr });
  const wErr = validateWorks(worksJson);
  if (wErr) return res.status(400).json({ error: wErr });
  const pErr = validatePublishPaths(blobs, deletedPaths);
  if (pErr) return res.status(400).json({ error: pErr });

  const branch = process.env.GITHUB_BRANCH || 'main';
  const upserts = [
    { path: 'content/site.json', content: JSON.stringify(siteJson, null, 2) + '\n', encoding: 'utf-8' },
    { path: 'content/works.json', content: JSON.stringify(worksJson, null, 2) + '\n', encoding: 'utf-8' },
    ...blobs.map((b) => ({ path: b.path, sha: b.sha })),
  ];

  const safeMsg = (message && String(message).trim().slice(0, 72)) || 'update content';

  try {
    const { commitSha, commitUrl } = await commitChanges(branch, `content: ${safeMsg}`, upserts, deletedPaths);
    res.status(200).json({ ok: true, commitSha, commitUrl, branch });
  } catch (e) {
    res.status(502).json({ error: 'הפרסום נכשל: ' + e.message });
  }
}
