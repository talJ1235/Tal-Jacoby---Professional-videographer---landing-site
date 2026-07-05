# Performance Optimization

Performance floor for the public route.

- Budget: public-route JS ≤ 180KB gzip (React + Framer Motion + Lenis + app).
- Media is lazy by default:
  - Preview loops: `preload="none"`, src assigned only on hover (fine pointer) or on
    ≥60% visibility (coarse pointer). Never preloaded.
  - Thumbnails: WebP. First two `loading="eager"`, the rest `loading="lazy"`,
    `decoding="async"`.
  - Hero video: `preload="metadata"` + poster for fast first paint.
- Zero CLS: every media container has a fixed `aspect-ratio`; the navbar is fixed so it
  never reflows content.
- Fonts: a single stylesheet request, `display=swap`, only the weights actually used.
- Pause offscreen video via IntersectionObserver to save battery/CPU.
- Remove dead code after refactors: unused components, CSS, and imports. Do NOT remove
  router/axios/admin code — /admin depends on it.
- Measure: run `npm run build`, read the gzip chunk sizes, and split only if over budget.
