# Frontend Design

General design discipline. `portfolio-site.md` overrides this file on any conflict.

- Design with tokens, never hard-coded values. Colors, spacing, type, motion all come
  from CSS custom properties defined in one place (`styles/tokens.css`).
- Respect a strict type scale. Personality comes from scale contrast, not many fonts.
- Every interactive element has a visible `:focus-visible` state and a ≥44px hit area.
- Zero cumulative layout shift: reserve space with `aspect-ratio` on all media.
- Mobile-first. Verify 375px has no horizontal scroll before considering a layout done.
- RTL correctness: use logical properties (`inset-inline-start`, `margin-inline`,
  `padding-inline`) instead of left/right so the layout mirrors correctly.
- Motion is subtle and purposeful. Prefer opacity and small transforms. Honor
  `prefers-reduced-motion`.
- Less is more: remove decoration that doesn't serve the content.
