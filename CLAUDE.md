# Tal Jacoby Portfolio — Claude Code Instructions

> **New here? Read `CONTEXT.md` at the repo root first**, then this file, then the
> skills below. Skim `SESSIONS.md` for recent history. This is a sequential
> multi-account project: `git pull` before you start, `git push` (only on the
> user's "push") when you finish.

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
- Content source of truth: `content/site.json` + `content/works.json` (repo root),
  imported at build via the Vite `@content` alias. Media under `client/public/media/`.
  (`/admin → תוכן` edits these via the GitHub API → one commit to `main` → deploy.)
- Palette/typography/motion come ONLY from tokens.css per portfolio-site.md.
- Never push to `main` without the user's explicit "push" — a push = a live deploy.
- After every task: build → verify → **update `CONTEXT.md` + append `SESSIONS.md`**
  → commit → HANDOFF SUMMARY.
- If a referenced file name doesn't exist, find the equivalent in the repo and
  adapt — never scaffold a duplicate.

## Project operations (preserved from the previous build)
- Dev: `cd server && npm run dev` (:3001) · `cd client && npm run dev` (:5173)
- Build (public site): `cd client && npm run build` → outputs `dist`.
- Deploy: Vercel — root directory `client`, build `npm run build`, output `dist`.
- GitHub remote: `talJ1235/Tal-Jacoby---Professional-videographer---landing-site`
  (deploys `master`→`main`). Pushing triggers a live deploy — only push when asked.
- Security: never commit real `.env` secrets; `.env.example` uses `CHANGE_ME_...`
  placeholders. Keep the public GitHub README minimal.
- `.claude/skills/*.md` and `.claude/launch.json` ARE committed (so they travel to
  the other account); only `.claude/settings.local.json` stays machine-local.
