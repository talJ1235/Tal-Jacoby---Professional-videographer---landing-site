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
        className="navbar__logo"
        onClick={scrollToTop}
        aria-label="טל יעקבי — לראש הדף"
      >
        <img
          className="navbar__logo-img"
          src="/media/brand/logo.png"
          alt="טל יעקבי"
          width="28"
          height="34"
          decoding="async"
        />
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
