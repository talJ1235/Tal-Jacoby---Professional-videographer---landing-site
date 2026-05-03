import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { scrollToSection } from '../utils/smoothScroll';
import './Hero.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] },
});

export function Hero() {
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '972500000000';

  const scrollTo = (id) => scrollToSection(id);

  return (
    <section id="hero" className="hero">
      <div className="hero__inner">
        {/* Text column */}
        <div className="hero__text">
          <motion.h1 className="hero__name" {...fadeUp(0.1)}>
            טל יעקבי
          </motion.h1>
          <motion.p className="hero__title" {...fadeUp(0.25)}>
            צלם וידאו
          </motion.p>
          <motion.p className="hero__tagline" {...fadeUp(0.4)}>
            מספר סיפורים דרך עדשה — חתונות, אירועים, תדמית עסקית
          </motion.p>
          <motion.div className="hero__ctas" {...fadeUp(0.55)}>
            <Button size="lg" onClick={() => scrollTo('portfolio')}>
              תיק עבודות
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo('contact')}>
              צור קשר
            </Button>
          </motion.div>
        </div>

        {/* Photo column */}
        <motion.div
          className="hero__photo-wrap"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="hero__photo hero-photo-ring">
            <img src="/hero-photo.png" alt="טל יעקבי" />
          </div>

          <div className="hero__badge float-badge">
            <span>📷</span> צילום
          </div>
          <div className="hero__badge hero__badge--bottom float-badge">
            <span>🎬</span> וידאו
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll scroll-indicator" onClick={() => scrollTo('about')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
