import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenis } from '../lib/scroll';

// Initializes Lenis smooth scrolling for the public site.
// Skips entirely under prefers-reduced-motion (native scroll only).
export function useLenis() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const lenis = new Lenis();
    setLenis(lenis);

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
}
