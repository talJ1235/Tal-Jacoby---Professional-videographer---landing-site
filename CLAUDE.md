# Tal Jacoby — Landing Site

## Project overview
Full-stack photographer/videographer portfolio landing page.
- **Frontend**: React 18 + Vite, Framer Motion, RTL Hebrew layout (`dir="rtl"`)
- **Backend**: Node.js + Express, Prisma ORM, SQLite
- **Dev ports**: frontend `5173`, backend `3001`

## Dev commands
```bash
# Start both servers (from root)
cd server && npm run dev   # backend on :3001
cd client && npm run dev   # frontend on :5173
```

## Key files to know
| File | Purpose |
|------|---------|
| `client/src/styles/THEME.css` | **Single source of truth for all colors** — edit here only |
| `client/src/hooks/useSectionScroll.js` | Section-by-section smooth scroll (RAF + easeInOutCubic) |
| `client/src/sections/Portfolio.jsx` | Edit `PORTFOLIO_ITEMS` array to add YouTube video IDs |
| `client/src/components/layout/Footer.jsx` | Contact info (phone, email, location) |
| `client/src/sections/Contact.jsx` | Contact section + form |
| `client/public/logo.png` | Navbar logo image |
| `client/public/favicon.png` | Browser tab icon |

## Architecture notes
- `useSectionScroll` intercepts wheel events on desktop (>768px), animates with `requestAnimationFrame` + `easeInOutCubic` over 850ms
- Footer is a separate snap zone — from the last section, scroll down shows the footer; scroll up from footer returns to the last section
- All sections use `min-height: 100vh` + Framer Motion `whileInView` entry animations
- Portfolio thumbnails load from YouTube thumbnail API: `https://img.youtube.com/vi/{youtubeId}/maxresdefault.jpg`

## GitHub workflow
Remote: `https://github.com/talJ1235/Tal-Jacoby---Professional-videographer---landing-site.git`

After making changes, stage and commit with a descriptive message, then ask the user before pushing:
```bash
git add <specific files>
git commit -m "description of change"
# Ask user: "Push to GitHub?" before running git push
```

> **Important:** Always ask for explicit confirmation before pushing to the remote. Do not push automatically without user approval.

## Vercel deployment
- Deploy the `client/` folder as a Vite static site
- Set root directory to `client` in Vercel project settings
- Build command: `npm run build` | Output directory: `dist`
- Environment variables: set `VITE_WHATSAPP_NUMBER` to `972547713317`
