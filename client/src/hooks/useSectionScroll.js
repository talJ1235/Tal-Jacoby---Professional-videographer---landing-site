import { useEffect, useRef } from 'react';

const SECTION_IDS = ['hero', 'about', 'portfolio', 'contact'];
const DURATION    = 1200; // ms
const POST_LOCK   = 300;  // ms אחרי סיום — חלון מת שמונע wheel עודף

// easeOutExpo — מתחיל מהיר, עוצר רכות
function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function animateScroll(targetY, duration, onDone) {
  const startY   = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) { onDone?.(); return () => {}; }

  let startTime = null;
  let rafId;

  function step(ts) {
    if (!startTime) startTime = ts;
    const t = Math.min((ts - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeOutExpo(t));
    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      window.scrollTo(0, targetY);
      onDone?.();
    }
  }

  rafId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(rafId);
}

export function useSectionScroll() {
  const activeRef   = useRef(0);
  const lockRef     = useRef(false);
  const cancelRef   = useRef(null);
  const lastFireRef = useRef(0);

  useEffect(() => {
    if (window.innerWidth <= 768) return;

    // IntersectionObserver — מסנכרן activeRef גם בניווט מהתפריט
    const observers = SECTION_IDS.map((id, i) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) activeRef.current = i; },
        { threshold: 0.5 }
      );
      obs.observe(el);
      return obs;
    });

    const getSectionTop = (index) => {
      const el = document.getElementById(SECTION_IDS[index]);
      return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
    };

    const goTo = (index) => {
      if (index < 0 || index >= SECTION_IDS.length) return;
      const targetY = getSectionTop(index);
      if (targetY === null) return;

      cancelRef.current?.();
      activeRef.current   = index;
      lockRef.current     = true;
      lastFireRef.current = performance.now();

      cancelRef.current = animateScroll(targetY, DURATION, () => {
        setTimeout(() => { lockRef.current = false; }, POST_LOCK);
      });
    };

    const onWheel = (e) => {
      e.preventDefault();

      if (lockRef.current) return;

      const now = performance.now();
      if (now - lastFireRef.current < DURATION * 0.25) return;

      const dir = e.deltaY > 0 ? 1 : -1;

      // גבולות — לא גולל מעבר לסקשן ראשון/אחרון
      if (activeRef.current <= 0 && dir < 0) return;
      if (activeRef.current >= SECTION_IDS.length - 1 && dir > 0) return;

      goTo(activeRef.current + dir);
    };

    const onKey = (e) => {
      if (lockRef.current) return;
      let next = activeRef.current;
      if      (e.key === 'ArrowDown' || e.key === 'PageDown') next = Math.min(next + 1, SECTION_IDS.length - 1);
      else if (e.key === 'ArrowUp'   || e.key === 'PageUp'  ) next = Math.max(next - 1, 0);
      else return;
      if (next === activeRef.current) return;
      e.preventDefault();
      goTo(next);
    };

    window.addEventListener('wheel',   onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('wheel',   onWheel);
      window.removeEventListener('keydown', onKey);
      observers.forEach(o => o?.disconnect());
      cancelRef.current?.();
    };
  }, []);
}
