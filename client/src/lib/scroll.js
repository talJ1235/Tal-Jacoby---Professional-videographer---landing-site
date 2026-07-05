// Module-level ref to the active Lenis instance so any component can control
// smooth scroll without prop-drilling. When Lenis is off (reduced-motion or not
// yet mounted) we still animate with our OWN eased rAF tween — an explicit
// button/nav scroll should always glide, never snap, on every browser.

let lenis = null;
let rafScroll = null;

export function setLenis(instance) {
  lenis = instance;
}

// easeInOutCubic — a premium, symmetric glide (slow-in, fast-middle, slow-out).
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Self-contained smooth scroll — does NOT depend on Lenis. Used whenever Lenis
// isn't the active scroller (e.g. reduced-motion) so the glide still happens.
function tweenScrollTo(targetY, duration = 1100) {
  if (rafScroll) cancelAnimationFrame(rafScroll);
  const startY = window.scrollY || window.pageYOffset || 0;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const endY = Math.max(0, Math.min(targetY, maxY));
  const dist = endY - startY;
  if (Math.abs(dist) < 2) return;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min((now - t0) / duration, 1);
    window.scrollTo(0, startY + dist * easeInOutCubic(p));
    if (p < 1) rafScroll = requestAnimationFrame(step);
    else rafScroll = null;
  };
  rafScroll = requestAnimationFrame(step);
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.1, easing: easeInOutCubic });
  else tweenScrollTo(0);
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { duration: 1.1, easing: easeInOutCubic });
  } else {
    const targetY = (window.scrollY || 0) + el.getBoundingClientRect().top;
    tweenScrollTo(targetY);
  }
}

export function stopScroll() {
  if (lenis) lenis.stop();
}

export function startScroll() {
  if (lenis) lenis.start();
}
