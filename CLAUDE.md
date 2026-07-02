# Tal Jacoby Portfolio — Claude Code Instructions

## Skills (read before working)
@.claude/skills/portfolio-site.md        ← project identity, wins all conflicts
@.claude/skills/frontend-design.md
@.claude/skills/react-architecture.md
@.claude/skills/performance-optimization.md

## Project
Monorepo: client/ (React 18 + Vite + plain CSS tokens + Framer Motion + Lenis)
and server/ (Express + Prisma + /admin CRM — DO NOT TOUCH).
Single-page public site, Hebrew RTL, dark grayscale, work-first.
Sections: Opening (fullscreen showreel) → Works (grid + fullscreen morph player) → Footer.

## Key rules
- Stack is frozen: no GSAP, no Tailwind, no UI kits, no new deps without asking.
- Content source of truth: src/data/works.js. Media under client/public/media/.
- Palette/typography/motion come ONLY from tokens.css per portfolio-site.md.
- After every task: build → verify → commit → HANDOFF SUMMARY.
- If a referenced file name doesn't exist, find the equivalent in the repo and
  adapt — never scaffold a duplicate.

## Project operations (preserved from the previous build)
- Dev: `cd server && npm run dev` (:3001) · `cd client && npm run dev` (:5173)
- Build (public site): `cd client && npm run build` → outputs `dist`.
- Deploy: Vercel — root directory `client`, build `npm run build`, output `dist`.
- GitHub remote: `talJ1235/Tal-Jacoby---Professional-videographer---landing-site`
  (deploys `master`→`main`). Pushing triggers a live deploy — only push when asked.
- Security: never commit real `.env` secrets; `.env.example` uses `CHANGE_ME_...`
  placeholders. `.claude/` is gitignored. Keep the public GitHub README minimal.
