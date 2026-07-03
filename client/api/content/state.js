import { setCors } from '../_lib/security.js';
import { requireAdmin } from '../_lib/content.js';
import { getBranchHead, getJsonFile, listDir } from '../_lib/github.js';

// GET /api/content/state — current site.json, works.json and the media file
// list read FROM GitHub at the deploy branch head, so the editor always edits
// the latest published truth. Missing files come back as null (first-run).
export default async function handler(req, res) {
  if (setCors(req, res, 'GET, OPTIONS')) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  const branch = process.env.GITHUB_BRANCH || 'main';
  try {
    const head = await getBranchHead(branch);
    const [site, works, mediaFiles] = await Promise.all([
      getJsonFile('content/site.json', branch),
      getJsonFile('content/works.json', branch),
      listDir('client/public/media/works', branch),
    ]);
    res.status(200).json({ branch, head: head.commitSha, site, works, mediaFiles });
  } catch (e) {
    res.status(502).json({ error: 'שגיאה בקריאת התוכן מ־GitHub: ' + e.message });
  }
}
