import { useEffect, useRef } from 'react';

const SECTION_IDS = ['hero', 'about', 'portfolio', 'contact'];
const DURATION    = 950;  // ms
const POST_LOCK   = 320;  // ms חלון מת אחרי סיום — מונע wheel שהצטבר

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

// מחשב את הסקשן הנוכחי לפי מיקום גלילה אמיתי — אמין יותר מ-IntersectionObserver
function getCurrentSectionIndex() {
  const mid = window.scrollY + window.innerHeight * 0.4;
  let current = 0;
  for (let i = 0; i < SECTION_IDS.length; i++) {
    const el = document.getElementById(SECTION_IDS[i]);
    if (el && el.offsetTop <= mid) current = i;
  }
  return current;
}

export function useSectionScroll() {
  const lockRef     = useRef(false);
  const cancelRef   = useRef(null);
  const lastFireRef = useRef(0);

  useEffect(() => {
    if (window.innerWidth <= 768) return;

    const getSectionTop = (index) => {
      const el = document.getElementById(SECTION_IDS[index]);
      return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
    };

    const goTo = (index) => {
      if (index < 0 || index >= SECTION_IDS.length) return;
      const targetY = getSectionTop(index);
      if (targetY === null) return;

      cancelRef.current?.();
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
      if (now - lastFireRef.current < POST_LOCK) return;

      const dir     = e.deltaY > 0 ? 1 : -1;
      const current = getCurrentSectionIndex(); // ← תמיד מחשב מחדש מה-DOM
      const next    = current + dir;

      if (next < 0 || next >= SECTION_IDS.length) return; // גבולות

      goTo(next);
    };

    const onKey = (e) => {
      if (lockRef.current) return;
      const current = getCurrentSectionIndex();
      let next = current;
      if      (e.key === 'ArrowDown' || e.key === 'PageDown') next = Math.min(current + 1, SECTION_IDS.length - 1);
      else if (e.key === 'ArrowUp'   || e.key === 'PageUp'  ) next = Math.max(current - 1, 0);
      else return;
      if (next === current) return;
      e.preventDefault();
      goTo(next);
    };

    window.addEventListener('wheel',   onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('wheel',   onWheel);
      window.removeEventListener('keydown', onKey);
      cancelRef.current?.();
    };
  }, []);
}
