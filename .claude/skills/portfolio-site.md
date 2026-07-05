# PORTFOLIO SITE — Project Identity Skill
This file wins every conflict with other skills. Read before any visual, layout, or animation decision.

## Identity
Personal portfolio of Tal Jacoby (טל יעקבי) — videographer. Events (bar/bat mitzvahs,
family), business events, and commercial videos for businesses. Audience: Hebrew-speaking
parents and business owners, mostly arriving on mobile from a WhatsApp link.
The page's single job: make the visitor watch footage, then find the email in the footer.
Tone: quiet confidence. The site presents; it never sells.

## Hard rules
- Hebrew, RTL. `lang="he" dir="rtl"` on <html>. All UI copy in Hebrew.
- Palette is grayscale only (tokens below). NO accent color. NO gradients except the
  hero scrim. The footage is the only color on the page.
- border-radius: 0 everywhere. No shadows except the player backdrop.
- No icons except: scroll cue line, close ✕, and plain-text footer links. No emoji. Ever.
- No marketing copy: no CTAs, no "בואו נדבר", no stats, no testimonials, no about text.
- Typeface: Heebo only (300/400/500/700). No second family.
- Animation: Framer Motion + Lenis ONLY. Never install GSAP, Tailwind, or UI libraries.
- No new dependencies without asking first.
- Server and /admin: do not modify, do not delete. Public site must not call the
  contact/leads API.

## Tokens (source of truth — put in styles/tokens.css)
--bg-0:#0A0A0A; --bg-1:#101010; --bg-2:#161616; --border:#1F1F1F;
--text-1:#F2F2F2; --text-2:#A0A0A0; --text-3:#5C5C5C;
--overlay:rgba(10,10,10,0.98);
--hero-scrim:linear-gradient(to top, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0) 42%);
--font:'Heebo',sans-serif;
--fs-hero-name:clamp(2.75rem,8.5vw,6.25rem); --fs-hero-sub:clamp(1rem,1.6vw,1.1875rem);
--fs-label:0.8125rem; --fs-work-title:1.0625rem; --fs-work-tag:0.875rem;
--fs-footer:0.9375rem;
--ease-out:cubic-bezier(0.22,1,0.36,1);
--dur-fast:200ms; --dur-med:450ms; --dur-slow:700ms;
--max-w:1400px; --pad-x:48px; /* 20px under 768px */ --radius:0px;

## Motion doctrine
- One signature: the work-card → fullscreen-player morph (Framer Motion layoutId).
  Everything else is quiet: single fade-ups, opacity, small scale (max 1.03).
- Durations from tokens only. Easing: --ease-out. Nothing bounces, nothing loops
  except videos and the scroll cue.
- prefers-reduced-motion: disable Lenis, entrance animations, hover scale, and
  autoplaying previews. Thumbnails + click-to-play still work.

## Media doctrine
- Preview loops: self-hosted mp4, muted, loop, playsinline. NEVER preloaded —
  src assigned on first hover (fine pointer) or on ≥60% visibility (coarse pointer).
- Full videos: unlisted YouTube via youtube-nocookie.com iframe, mounted only after
  the morph completes. No react-player, no extra deps.
- Every media box: aspect-ratio 16/9, overflow hidden, bg --bg-1. Zero CLS.
- Missing asset files must degrade silently (poster → bg-1). Never a broken layout.

## Definition of done (every task)
1. `npm run build` passes with zero errors/warnings.
2. No horizontal scroll at 375px. Tap targets ≥ 44px.
3. Keyboard: cards focusable, Enter/Space opens, Esc closes, focus returns.
4. /admin still loads.
5. git add + commit with a clear message.
6. Output a HANDOFF SUMMARY: what was built, files touched, decisions made,
   anything the next prompt needs to know.
