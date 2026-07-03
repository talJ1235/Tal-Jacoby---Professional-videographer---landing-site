/**
 * GitHub Git Data API helpers — publish content as ONE atomic commit.
 * Uses the built-in fetch (Node 18+ on Vercel). No external dependencies.
 *
 * Env (server-side only): GITHUB_TOKEN, GITHUB_REPO (owner/name), GITHUB_BRANCH.
 */

const API = 'https://api.github.com';

function repo() {
  const r = process.env.GITHUB_REPO;
  if (!r) throw new Error('GITHUB_REPO is not set');
  return r;
}

async function gh(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'tal-jacoby-content-publisher',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data && data.message ? data.message : `GitHub ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Reads ───────────────────────────────────────────────────────────────────

export async function getBranchHead(branch) {
  const ref = await gh(`/repos/${repo()}/git/ref/heads/${encodeURIComponent(branch)}`);
  const commitSha = ref.object.sha;
  const commit = await gh(`/repos/${repo()}/git/commits/${commitSha}`);
  return { commitSha, treeSha: commit.tree.sha };
}

// Returns parsed JSON of a file at a ref, or null if it doesn't exist.
export async function getJsonFile(path, ref) {
  try {
    const data = await gh(
      `/repos/${repo()}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref)}`
    );
    const content = Buffer.from(data.content, data.encoding || 'base64').toString('utf-8');
    return JSON.parse(content);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

// Lists file paths (recursively) under a directory at a ref. [] if missing.
export async function listDir(dir, ref) {
  try {
    const items = await gh(
      `/repos/${repo()}/contents/${encodeURI(dir)}?ref=${encodeURIComponent(ref)}`
    );
    const out = [];
    for (const it of items) {
      if (it.type === 'dir') {
        out.push(...(await listDir(it.path, ref)));
      } else if (it.type === 'file') {
        out.push(it.path);
      }
    }
    return out;
  } catch (e) {
    if (e.status === 404) return [];
    throw e;
  }
}

// ── Write (single atomic commit) ─────────────────────────────────────────────

// Creates a blob and returns its sha. encoding: 'utf-8' | 'base64'.
export async function createBlob(content, encoding) {
  const data = await gh(`/repos/${repo()}/git/blobs`, {
    method: 'POST',
    body: { content, encoding },
  });
  return data.sha;
}

/**
 * Commit a set of changes atomically on top of `branch` head.
 * @param {string} branch
 * @param {string} message
 * @param {Array<{path:string, content?:string, encoding?:string, sha?:string}>} upserts
 *   Each item is either {path, content, encoding} (blob created here) or
 *   {path, sha} (a pre-created blob sha).
 * @param {string[]} deletions - repo-relative paths to remove
 * @returns {{commitSha:string, commitUrl:string}}
 */
export async function commitChanges(branch, message, upserts, deletions = []) {
  const { commitSha: parentSha, treeSha: baseTree } = await getBranchHead(branch);

  const tree = [];
  for (const f of upserts) {
    const blobSha = f.sha ? f.sha : await createBlob(f.content, f.encoding);
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blobSha });
  }
  for (const path of deletions) {
    // sha:null tells the tree API to delete the path
    tree.push({ path, mode: '100644', type: 'blob', sha: null });
  }

  const newTree = await gh(`/repos/${repo()}/git/trees`, {
    method: 'POST',
    body: { base_tree: baseTree, tree },
  });

  const commit = await gh(`/repos/${repo()}/git/commits`, {
    method: 'POST',
    body: { message, tree: newTree.sha, parents: [parentSha] },
  });

  await gh(`/repos/${repo()}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: { sha: commit.sha, force: false },
  });

  return { commitSha: commit.sha, commitUrl: commit.html_url };
}
