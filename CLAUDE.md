# Tal Jacoby — Landing Site

## Project overview
Full-stack photographer/videographer portfolio landing page.
- **Frontend**: React 18 + Vite, Framer Motion, RTL Hebrew layout (`dir="rtl"`)
- **Backend**: Node.js + Express, Prisma ORM, SQLite
- **Dev ports**: frontend `5173`, backend `3001`

## Dev commands
```bash
cd server && npm run dev   # backend on :3001
cd client && npm run dev   # frontend on :5173
```

## Key files
| File | Purpose |
|------|---------|
| `client/src/styles/THEME.css` | **Single source of truth for all colors** |
| `client/src/hooks/useSectionScroll.js` | Section scroll (RAF + easeOutExpo, 1200ms) |
| `client/src/utils/smoothScroll.js` | Shared scroll utility used by Navbar |
| `client/src/sections/Portfolio.jsx` | Edit `PORTFOLIO_ITEMS` to add YouTube video IDs |
| `client/src/sections/Contact.jsx` | Contact section + form + social links |
| `client/public/logo-navbar.png` | Navbar logo (white on transparent) |
| `client/public/favicon.png` | Browser tab icon |

## Architecture notes
- `useSectionScroll` intercepts wheel events on desktop (>768px), animates with RAF + `easeOutExpo` over 1200ms
- No footer — social links and copyright are inside the Contact section
- All sections use `min-height: 100vh` + Framer Motion `whileInView` entry animations
- Portfolio thumbnails: `https://img.youtube.com/vi/{youtubeId}/maxresdefault.jpg`

## GitHub — Auto-push after every change
Remote: `https://github.com/talJ1235/Tal-Jacoby---Professional-videographer---landing-site.git`

**After every code change, automatically run:**
```bash
git add -A
git commit -m "<short description of change>"
git push origin master:main
```
Do this immediately after finishing each task — no need to ask the user for permission to push.

## Security rules
- Never commit `.env` files with real secrets
- `.env.example` files must use `CHANGE_ME_...` placeholders only
- `.claude/` folder is gitignored — never stage it
- README.md on GitHub is intentionally minimal — do not add technical details

## Vercel deployment
- Root directory: `client` | Build: `npm run build` | Output: `dist`
- Env var: `VITE_WHATSAPP_NUMBER=972547713317`
