# CONTEXT — read this first

Onboarding for any Claude (or person) picking up this repo from GitHub. Read this,
then `CLAUDE.md`, then `.claude/skills/portfolio-site.md` (it wins every conflict).
Then skim `SESSIONS.md` for what changed most recently.

---

## 1. What this project is

**Tal Jacoby (טל יעקבי) — videographer portfolio.** A single-page site whose only
job is: make the visitor watch footage, then find the email in the footer. Events
(bar/bat mitzvah, family), business events, commercial videos.

- **Hebrew, RTL** (`lang="he" dir="rtl"`). All UI copy in Hebrew.
- **Dark, grayscale only.** No accent color, no gradients (except the hero scrim),
  `border-radius: 0`, no shadows except the player backdrop. The footage is the
  only color on the page. Tone: quiet confidence — it presents, never sells.
- **Audience:** Hebrew-speaking parents & business owners, mostly arriving on
  **mobile from a WhatsApp link.**
- **Live at:** https://www.taljacoby.co.il

## 2. Architecture

**Monorepo, two halves:**
- `client/` — **React 18 + Vite**, plain CSS design tokens, **Framer Motion + Lenis**
  for motion. This is what deploys.
- `server/` — legacy Express + Prisma. **NOT deployed. Do not touch.** The real
  backend is serverless (below).

**Production backend = Vercel Serverless Functions in `client/api/`:**
- `client/api/leads*` — leads CRM (Neon Postgres + Resend email).
- `client/api/content*` — content publishing via the **GitHub Git Data API**.

**Content is the source of truth, as JSON at the repo root:**
- `content/site.json` — hero name/subtitle, hero video/YouTube id, brand, footer, SEO.
- `content/works.json` — the works array (8 works today).
- Imported at **build time** via Vite's `@content` alias + an SEO `transformIndexHtml`
  plugin. A runtime content store (`contentStore.js` / `useContent.js`) powers the
  live `/admin` preview.

**Publish pipeline (how content goes live without code):**
`/admin` → **תוכן** tab → edit visually → **שמור ופרסם** → the serverless function
makes **one git commit to `main`** via the GitHub API → **Vercel rebuilds** → live
in ~2 min. (See `README.md` for the editor walkthrough.)

**Deploy:** Vercel watches **`main`**. **Any push to `main` = a live deploy.**
GitHub repo: `talJ1235/Tal-Jacoby---Professional-videographer---landing-site`.

**Key front-end pieces:**
- **Dual-path hero** (`client/src/sections/Opening.jsx`): `site.heroVideo`
  (self-hosted `<video>`) **wins** → else `site.heroYoutubeId` (muted YouTube
  background embed) → else the default `showreel.mp4`. Poster shows for instant
  first paint. Currently uses the self-hosted `client/public/media/showreel/hero.mp4`.
- **Nav** (`client/src/components/layout/Navbar.jsx`): a white "TJ" serif monogram
  logo (`/media/brand/logo.png`) at the start side (click → top) + the "עבודות"
  link. Both have a soft text/drop-shadow for legibility over the video.
- **Smooth scroll** (`client/src/lib/scroll.js`): `scrollToSection` glides via Lenis
  when active, else via its OWN eased rAF tween (`tweenScrollTo`, easeInOutCubic,
  1100ms) — so the CTA/nav scroll animates on EVERY browser, including under
  reduced-motion (where Lenis is off). Do NOT revert this to a bare
  `scrollIntoView` fallback — that's what made it jump for reduced-motion users.
- **Hero CTA:** an understated ghost button "צפו בעבודות" (`.opening__cta`) below
  the subtitle smooth-scrolls to `#works`. It replaced an old scroll-cue line.
- **Gallery player** (`client/src/components/PlayerOverlay.jsx`): clicking a work
  card **morphs** it to a fullscreen player over ~0.9s (Framer Motion `layoutId` —
  the site's ONE signature animation) using the **YouTube IFrame Player API**.
  The thumbnail is NEVER shown in the overlay (it lives only in the grid). During
  load the frame is a **neutral dark plate** (`.player__cover`, radial `--bg-2→
  --bg-0`) with a subtle grayscale "powering-on" shimmer (`.player__shimmer`) —
  no image of the video — which masks YouTube's ~1.3s cold-start. It's removed on
  the earliest real-playback signal (PLAYING / first `getCurrentTime` advance),
  `seekTo(0)` guarantees the true start. Pre-warm (preconnect + IFrame API preload)
  happens on card hover/visibility in `WorkCard.jsx`. Open with `?ytdebug=1` to log
  timestamped player events.

**Safety nets (don't remove):**
- `client/vercel.json` — SPA rewrite `"/((?!assets/).*)"→/index.html`; `/assets/`
  is immutable-cached, everything else `no-cache`. (A past bad rewrite once
  white-screened the live site by serving `text/html` for missing assets.)
- `client/src/components/ErrorBoundary.jsx` — catches render errors.
- `npm run check:live` (`client/scripts/check-live.js`) — post-deploy guard that
  verifies the live JS bundle loads as JavaScript (not HTML). Run it after pushing.

## 3. Current state

- **Live** at www.taljacoby.co.il, 8 works, self-hosted hero video, `/admin`
  content editor + leads CRM all working.
- We work in **iterative polish "layers"** — small, verified, gated pushes.
- **Done recently:** self-hosted hero video; frozen-hero autoplay fix (muted
  applied imperatively + play-retry + plays under reduced-motion); bolder hero
  text (Heebo 700 + stronger scrim/shadow); gallery-player poster-timing fix
  (removed the blind 4s timer that caused the 1–2s flash + mid-clip start).
  See `SESSIONS.md` for dates.
- **Known / pending:**
  - Gallery player still has a **~1.3s YouTube cold-start** (player chrome +
    buffer) before the first frame — now **masked inside the ~0.9s morph + dark
    "powering-on" plate** so it isn't perceived. Eliminating it entirely would need
    a persistent pre-warmed player, which conflicts with the card→player morph;
    kept the morph instead. Deferred as a scoped rearchitecture if ever wanted.
  - Each hero-video swap adds ~20MB to git history (git can't delta video). Fine
    for now; revisit Git LFS / external hosting if swaps become frequent.

## 4. Golden rules (do not violate)

From `CLAUDE.md` + `.claude/skills/portfolio-site.md`:
- **Design system is fixed:** grayscale tokens only (in `client/src/styles/tokens.css`),
  no accent color, `border-radius: 0`, **Heebo only** (300/400/500/700), no second
  font. No marketing copy, no CTAs, no icons beyond scroll cue / close ✕ / footer links.
- **Stack is frozen:** motion is **Framer Motion + Lenis only**. **No new dependencies**
  (no GSAP, Tailwind, UI kits, react-player…) without asking first.
- **Don't break `/admin`, the content editor, or the leads CRM.** Don't touch `server/`.
  The public site must not call the leads API.
- **`prefers-reduced-motion`:** disable Lenis, entrance animations, hover scale.
  (The muted hero background video is exempt — it still plays.)
- **Stop at the gate:** build + verify locally, show the user, and **only push when
  the user explicitly says "push"** — because a push to `main` deploys live.
- Definition of done (every task): `npm run build` clean; no horizontal scroll at
  375px; keyboard works (cards focusable, Enter/Space opens, Esc closes); `/admin`
  still loads; **update `CONTEXT.md` + `SESSIONS.md`**; commit with a clear message;
  output a HANDOFF SUMMARY.

## 5. Start / end of session checklist

**At the START of a session:**
1. `git pull` (this is a sequential multi-account project — always start from the
   latest `main`; never assume your local copy is current).
2. Read `CONTEXT.md` → `CLAUDE.md` → `.claude/skills/portfolio-site.md`; skim the
   top of `SESSIONS.md`.
3. `cd client && npm install` if dependencies changed.
4. Ensure `client/.env` exists (copy from `client/.env.example` — see §6).

**At the END of a session:**
1. `cd client && npm run build` — must be clean.
2. Verify locally (`npm run preview`, check the actual change in a browser).
3. **Update `CONTEXT.md`** (state / done / pending) **and append to `SESSIONS.md`.**
4. `git add` + commit with a clear message.
5. **Wait for the user's explicit "push".** Then `git push origin main`.
6. After the deploy, `cd client && npm run check:live` to confirm the live bundle loads.

## 6. What a fresh clone HAS vs. does NOT have

**In the repo (a fresh clone gets these):** all source (`client/`, `server/`),
`content/site.json` + `content/works.json`, media under `client/public/media/`,
`CLAUDE.md`, `.claude/skills/*.md`, `CONTEXT.md`, `SESSIONS.md`, `client/vercel.json`,
`.env.example` templates.

**NOT in the repo — the other account must set these up locally:**
- **`client/.env`** (gitignored). Copy `client/.env.example` → `client/.env` and fill:
  - `VITE_API_URL` (e.g. `http://localhost:3001` for local; empty in prod)
  - `VITE_WHATSAPP_NUMBER`, `VITE_ADMIN_PASSWORD`
  - `GITHUB_TOKEN` (fine-grained PAT, contents:read+write), `GITHUB_REPO`,
    `GITHUB_BRANCH=main`, `ADMIN_SECRET`
- **Root `.env`** (gitignored, only if running the legacy `server/`): `NODE_ENV`,
  `PORT`, `ADMIN_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, `VITE_WHATSAPP_NUMBER`,
  `VITE_ADMIN_PASSWORD`. See root `.env.example`.
- **`.claude/settings.local.json`** (gitignored, per-machine permission grants) —
  regenerated locally by Claude Code; nothing to copy.
- **`node_modules/`** — run `npm install` (in `client/`, and `server/` only if used).
- **Vercel dashboard env vars** — the REAL secrets (`GITHUB_TOKEN`, `ADMIN_SECRET`,
  Neon `DATABASE_URL`, `RESEND_API_KEY`) live in the **Vercel project settings**, not
  the repo. Account-level access to the **Vercel project**, the **Neon** database, and
  **Resend** is required to run/deploy the backend — these are outside GitHub.
- **Local tooling:** Node.js + npm, git (and `gh` optional). **ffmpeg** is needed only
  to (re)encode the hero video / poster — it is not committed and not required to run
  the site.

> Note: because the two accounts work **in sequence, never simultaneously**, the only
> coordination needed is: `git pull` before you start, `git push` (after the user's
> "push") when you finish, and keep `SESSIONS.md` honest.
