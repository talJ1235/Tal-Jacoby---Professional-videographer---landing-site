# Tal Jacoby — Videographer Portfolio

Dark, single-page videographer portfolio. React + Vite (frontend), Node.js +
Express + Prisma with a `/admin` CRM (backend). Public site: Hebrew RTL, grayscale,
work-first — a fullscreen showreel, a works grid with live previews, and a
fullscreen player that morphs out of the clicked card.

## How to add a work

1. **Shoot & pick.** Choose the strongest 3–4 second moment for the loop, and a
   single graded still for the thumbnail (keep the same grade family across works).
2. **Make the two self-hosted files** into `client/public/media/works/<slug>/`:

   ```bash
   # preview.mp4 — 3–4s silent loop, ≈1–2MB (adjust -ss to your moment)
   ffmpeg -ss 00:00:12 -t 4 -i source.mp4 -an \
     -vf "scale=960:-2,fps=25" \
     -c:v libx264 -profile:v main -crf 27 -pix_fmt yuv420p \
     -movflags +faststart preview.mp4

   # thumb.webp — 1600×900 graded still
   ffmpeg -i thumb.png -vf "scale=1600:-2" -quality 82 thumb.webp
   ```

3. **Upload the full film to YouTube as _Unlisted_** and copy its 11-char video ID.
4. **Add one object** to `client/src/data/works.js`:

   ```js
   {
     id: 'my-slug',
     title: 'כותרת · שם',
     tag: 'צילום וידאו · עיר',
     category: 'events',        // 'events' | 'business'
     youtubeId: 'XXXXXXXXXXX',
     thumb: '/media/works/my-slug/thumb.webp',
     preview: '/media/works/my-slug/preview.mp4',
   }
   ```

   The first item of a filtered list is the featured (full-width) card, so order
   your strongest work first.

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
cd server && npm run dev   # backend :3001 (CRM API + /admin data)
cd client && npm run dev   # frontend :5173
```
