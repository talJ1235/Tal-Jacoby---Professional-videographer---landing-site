// Module-level ref to the active Lenis instance so any component can control
// smooth scroll without prop-drilling. Falls back to native scroll when Lenis
// is disabled (reduced-motion) or not yet mounted.

let lenis = null;

export function setLenis(instance) {
  lenis = instance;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: 'auto' });
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el);
  else el.scrollIntoView();
}

export function stopScroll() {
  if (lenis) lenis.stop();
}

export function startScroll() {
  if (lenis) lenis.start();
}
