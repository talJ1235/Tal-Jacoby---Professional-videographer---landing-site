import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { scrollToSection } from '../utils/smoothScroll';
import './Hero.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] },
});

export function Hero() {
  const scrollTo = (id) => scrollToSection(id);

  return (
    <section id="hero" className="hero">

      {/* ── Visual: circle + photo, absolutely positioned ── */}
      <div className="hero__visual">
        {/* Circle fades in first, slides in from the left */}
        <motion.img
          src="/hero-circle.png"
          alt=""
          className="hero__circle-bg"
          aria-hidden="true"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
        />
        {/* Photo fades in second, same direction */}
        <motion.img
          src="/hero-photo.png"
          alt="טל יעקבי"
          className="hero__photo-img"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.95, delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* ── Text — right side (RTL start) ── */}
      <div className="hero__inner">
        <div className="hero__text">
          <motion.h1 className="hero__name" {...fadeUp(0.3)}>
            טל יעקבי
          </motion.h1>
          <motion.p className="hero__title" {...fadeUp(0.45)}>
            צלם וידאו
          </motion.p>
          <motion.p className="hero__tagline" {...fadeUp(0.6)}>
            מספר סיפורים דרך עדשה — חתונות, אירועים, תדמית עסקית
          </motion.p>
          <motion.div className="hero__ctas" {...fadeUp(0.75)}>
            <Button size="lg" onClick={() => scrollTo('portfolio')}>
              תיק עבודות
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo('contact')}>
              צור קשר
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll" onClick={() => scrollTo('about')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
