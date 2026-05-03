// ─── Shared smooth-scroll utility ───────────────────────────────────────────
// easeOutExpo — מתחיל מהיר, עוצר רכות
function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const DURATION = 1200; // ms — חייב להיות זהה ל-useSectionScroll

let activeRaf = null;

/**
 * גולל לסקשן לפי id עם אותה אנימציה כמו wheel scroll
 * @param {string} sectionId  — id של האלמנט (ללא #)
 * @param {Function} [onDone] — callback לאחר הגעה
 */
export function scrollToSection(sectionId, onDone) {
  const el = document.getElementById(sectionId);
  if (!el) return;

  const targetY = Math.round(el.getBoundingClientRect().top + window.scrollY);
  const startY  = window.scrollY;
  const distance = targetY - startY;

  if (Math.abs(distance) < 2) { onDone?.(); return; }

  // ביטול אנימציה קיימת
  if (activeRaf) cancelAnimationFrame(activeRaf);

  let startTime = null;

  function step(ts) {
    if (!startTime) startTime = ts;
    const t = Math.min((ts - startTime) / DURATION, 1);
    window.scrollTo(0, startY + distance * easeOutExpo(t));
    if (t < 1) {
      activeRaf = requestAnimationFrame(step);
    } else {
      window.scrollTo(0, targetY);
      activeRaf = null;
      onDone?.();
    }
  }

  activeRaf = requestAnimationFrame(step);
}
