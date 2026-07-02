import { useState, useEffect } from 'react';
import { scrollToTop, scrollToSection } from '../../lib/scroll';
import './Navbar.css';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <button
        type="button"
        className="navbar__name"
        onClick={scrollToTop}
        aria-label="טל יעקבי — לראש הדף"
      >
        טל יעקבי
      </button>
      <button
        type="button"
        className="navbar__link"
        onClick={() => scrollToSection('works')}
      >
        עבודות
      </button>
    </nav>
  );
}
