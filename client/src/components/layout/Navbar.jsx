import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scrollToSection } from '../../utils/smoothScroll';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'עליי', href: '#about' },
  { label: 'תיק עבודות', href: '#portfolio' },
  { label: 'צור קשר', href: '#contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '972500000000';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = ['about', 'portfolio', 'contact'];
    const observers = sections.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const handleNav = (href) => {
    setMenuOpen(false);
    const id = href.replace('#', '');
    scrollToSection(id);
  };

  return (
    <>
      <motion.nav
        className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="navbar__inner">
          <a className="navbar__logo" href="#" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }} aria-label="טל יעקבי — דף הבית">
            <img src="/logo-navbar.png" alt="טל יעקבי" className="navbar__logo-img" />
          </a>

          <ul className="navbar__links">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <a
                  className={`navbar__link${activeSection === href.replace('#', '') ? ' navbar__link--active' : ''}`}
                  href={href}
                  onClick={(e) => { e.preventDefault(); handleNav(href); }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* WhatsApp CTA — desktop */}
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('היי טל, אשמח לשמוע עוד')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__wa"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>

          <button className="navbar__burger" onClick={() => setMenuOpen((v) => !v)} aria-label="תפריט">
            <span className={`burger-line${menuOpen ? ' open' : ''}`} />
            <span className={`burger-line${menuOpen ? ' open' : ''}`} />
            <span className={`burger-line${menuOpen ? ' open' : ''}`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} />
            <motion.div
              className="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <button className="drawer__close" onClick={() => setMenuOpen(false)}>✕</button>
              <p className="drawer__logo">טל יעקבי</p>
              <ul className="drawer__links">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <a className="drawer__link" href={href} onClick={(e) => { e.preventDefault(); handleNav(href); }}>
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    className="drawer__link drawer__link--wa"
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('היי טל, אשמח לשמוע עוד')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📱 ווצאפ
                  </a>
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
