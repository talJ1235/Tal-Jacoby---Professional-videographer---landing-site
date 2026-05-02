import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './About.css';

function useCountUp(target, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);

  return count;
}

function StatCounter({ value, suffix, label, active }) {
  const count = useCountUp(value, 1800, active);
  return (
    <div className="stat">
      <span className="stat__number">
        {count}{suffix}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
};

export function About() {
  const statsRef = useRef(null);
  const [statsActive, setStatsActive] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsActive(true); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="about section-full">
      <div className="section about__inner">
        {/* Photo */}
        <motion.div className="about__photo-wrap" {...fadeUp}>
          <div className="about__photo">
            <span className="about__photo-placeholder">תמונה</span>
          </div>
          <div className="about__photo-accent" />
        </motion.div>

        {/* Content */}
        <div className="about__content">
          <motion.h2 className="about__heading" {...fadeUp} transition={{ duration: 0.7, delay: 0.1 }}>
            קצת עליי
          </motion.h2>

          <motion.p className="about__text" {...fadeUp} transition={{ duration: 0.7, delay: 0.2 }}>
            שלום! אני טל יעקבי, צלם ווידאוגרף פרילנסר עם ניסיון של מעל 5 שנים.
            מתמחה בצילום חתונות, אירועים, ווידאו תדמית לעסקים.
          </motion.p>

          <motion.p className="about__text" {...fadeUp} transition={{ duration: 0.7, delay: 0.3 }}>
            אני מאמין שכל רגע הוא סיפור שמחכה להיספר.
            עם עין אמנותית וגישה אישית, אני מבטיח תוצרים שתרצו לשתף.
          </motion.p>

          {/* Stats */}
          <motion.div
            ref={statsRef}
            className="about__stats"
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <StatCounter value={5} suffix="+" label="שנות ניסיון" active={statsActive} />
            <StatCounter value={200} suffix="+" label="פרויקטים" active={statsActive} />
            <StatCounter value={100} suffix="%" label="לקוחות מרוצים" active={statsActive} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
