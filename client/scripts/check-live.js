/**
 * Post-deploy guard: verify the live site serves its JS bundle as JavaScript,
 * not text/html. Catches the "white screen / module MIME" failure mode where a
 * missing hashed asset gets rewritten to index.html.
 *
 * Usage: node scripts/check-live.js [https://www.taljacoby.co.il]
 * Exits 0 on success, 1 on failure (usable in CI / a post-publish check).
 */
const SITE = (process.argv[2] || 'https://www.taljacoby.co.il').replace(/\/$/, '');

async function main() {
  const bust = `?cb=${Date.now()}`;
  const htmlRes = await fetch(`${SITE}/${bust}`, { cache: 'no-store' });
  const html = await htmlRes.text();

  const m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (!m) {
    console.error('FAIL: no bundle <script src="/assets/index-*.js"> found in index.html');
    process.exit(1);
  }

  const res = await fetch(`${SITE}${m[1]}${bust}`, { cache: 'no-store' });
  const ct = res.headers.get('content-type') || '';
  console.log(`index.html → ${htmlRes.status}; bundle ${m[1]} → ${res.status} (${ct})`);

  if (res.status !== 200 || !/javascript/i.test(ct)) {
    console.error('FAIL: bundle did not load as JavaScript — the live site would be blank.');
    process.exit(1);
  }
  console.log('OK: live site serves its JS bundle correctly.');
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
