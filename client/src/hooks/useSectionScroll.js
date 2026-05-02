import { useEffect, useRef } from 'react';

const SECTION_IDS = ['hero', 'about', 'portfolio', 'contact'];
const DURATION = 850; // ms — אורך האנימציה

// עקומת הזזה: מתחיל לאט, מאיץ באמצע, מאט בסוף
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// אנימציה חלקה עם requestAnimationFrame
function animateScroll(targetY, duration, onDone) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  let startTime = null;
  let rafId;

  function step(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (elapsed < duration) {
      rafId = requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  }

  rafId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(rafId);
}

export function useSectionScroll() {
  const activeRef  = useRef(0);
  const lockRef    = useRef(false);
  const cancelRef  = useRef(null);
  // true לאחר שעוברים מהסקשן האחרון לאזור ה-footer
  const beyondRef  = useRef(false);

  useEffect(() => {
    // במובייל — גלילה חופשית
    if (window.innerWidth <= 768) return;

    // IntersectionObserver — עוקב אחרי הסקשן הנוכחי
    const observers = SECTION_IDS.map((id, i) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            activeRef.current = i;
            beyondRef.current = false;
          }
        },
        { threshold: 0.5 }
      );
      obs.observe(el);
      return obs;
    });

    const goTo = (index) => {
      cancelRef.current?.();
      const el = document.getElementById(SECTION_IDS[index]);
      if (!el) return;
      lockRef.current = true;
      cancelRef.current = animateScroll(el.offsetTop, DURATION, () => {
        lockRef.current = false;
      });
    };

    const onWheel = (e) => {
      const dir = e.deltaY > 0 ? 1 : -1;

      // ── אזור footer (אחרי הסקשן האחרון) ────────────────────────────
      if (beyondRef.current) {
        if (dir < 0 && !lockRef.current) {
          // גלילה למעלה → חזרה לסקשן צור קשר
          e.preventDefault();
          beyondRef.current = false;
          goTo(SECTION_IDS.length - 1);
        }
        // גלילה למטה — אפשר לגלול חופשי (footer)
        return;
      }

      // ── סקשן אחרון + גלילה למטה → כניסה לאזור footer ───────────────
      if (activeRef.current >= SECTION_IDS.length - 1 && dir > 0) {
        beyondRef.current = true;
        return; // גלילה טבעית לראות footer
      }

      // ── סקשן ראשון + גלילה למעלה → אפשר לגלול ───────────────────
      if (activeRef.current <= 0 && dir < 0) return;

      // ── ניווט רגיל בין סקשנים ────────────────────────────────────
      e.preventDefault();
      if (lockRef.current) return;

      const next = activeRef.current + dir;
      if (next < 0 || next >= SECTION_IDS.length) return;
      activeRef.current = next;
      goTo(next);
    };

    const onKey = (e) => {
      if (lockRef.current) return;
      let next = activeRef.current;
      if      (e.key === 'ArrowDown' || e.key === 'PageDown') next = Math.min(next + 1, SECTION_IDS.length - 1);
      else if (e.key === 'ArrowUp'   || e.key === 'PageUp'  ) next = Math.max(next - 1, 0);
      else return;
      if (next === activeRef.current) return;
      e.preventDefault();
      activeRef.current = next;
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
