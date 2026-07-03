import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenis } from '../lib/scroll';
import { IS_PREVIEW } from '../content/previewMode';

// Initializes Lenis smooth scrolling for the public site.
// Skips under prefers-reduced-motion and in the editor preview iframe.
export function useLenis() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || IS_PREVIEW) return;

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
