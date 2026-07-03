# Tal Jacoby — Videographer Portfolio

Dark, single-page videographer portfolio. React + Vite (frontend), Node.js +
Express + Prisma with a `/admin` CRM (backend). Public site: Hebrew RTL, grayscale,
work-first — a fullscreen showreel, a works grid with live previews, and a
fullscreen player that morphs out of the clicked card.

## How to add a work — through `/admin` (no code)

Everything is edited visually in the admin, with a live preview of the site.

1. **Upload the film to YouTube as _Unlisted_** and copy its link.
2. Go to **`/admin` → תוכן**, click **+ עבודה חדשה**, and fill in the title,
   tag, category, and the YouTube link. Toggle **מוצג** on. (Optionally upload a
   graded still — it's auto-cropped to 1600×900 WebP — and a short preview loop.)
   Drag the ⋮⋮ handle to order works; the first one is the big featured card.
3. Click **שמור ופרסם**. This makes one git commit to the deploy branch; the live
   site updates in ~2 minutes.

Content is stored as `content/site.json` + `content/works.json` and imported at
build time — the admin just edits those files and the media via the GitHub API.
Thumbnails fall back to YouTube's image automatically until you upload your own.

### Appendix — optional preview-loop / showreel encoding (ffmpeg)

```bash
# preview.mp4 — 3–4s silent loop, ≈1–2MB (adjust -ss to your moment)
ffmpeg -ss 00:00:12 -t 4 -i source.mp4 -an \
  -vf "scale=960:-2,fps=25" \
  -c:v libx264 -profile:v main -crf 27 -pix_fmt yuv420p \
  -movflags +faststart preview.mp4

# thumb.webp — 1600×900 graded still (the admin does this for you on upload)
ffmpeg -i thumb.png -vf "scale=1600:-2" -quality 82 thumb.webp
```

## Showreel

Drop `client/public/media/showreel/showreel.mp4` (≤12MB, 25–35s, silent) and
`poster.jpg`. The opening section degrades gracefully to the poster, then to a
dark placeholder, if either is missing.

```bash
# showreel.mp4 — silent, ≤12MB
ffmpeg -i reel_master.mp4 -an \
  -vf "scale=1920:-2,fps=25" \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p \
  -movflags +faststart showreel.mp4

# poster.jpg
ffmpeg -ss 00:00:03 -i showreel.mp4 -frames:v 1 -q:v 2 poster.jpg
```

## Dev

```bash
cd client && npm run dev       # frontend :5173
cd client && npm run dev:api   # local /api shim :3001 (content endpoints + leads stub)
```

The production backend is **Vercel Serverless Functions** in `client/api/` (leads
CRM on Neon; content publishing via the GitHub Git Data API). Copy
`client/.env.example` → `client/.env` and fill the server-side vars
(`GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`, `ADMIN_SECRET`) — the same values
must exist in the Vercel dashboard. `client/.env` is gitignored.

Publishing writes one commit to the deploy branch (`main`) → Vercel rebuilds.
