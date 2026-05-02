import { useState, useEffect } from 'react';
import './SectionDots.css';

const SECTIONS = [
  { id: 'hero' },
  { id: 'about' },
  { id: 'portfolio' },
  { id: 'contact' },
];

export function SectionDots() {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const observers = SECTIONS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.35, rootMargin: '-60px 0px 0px 0px' }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const scrollTo = (id) => {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="section-dots" aria-label="ניווט בין סקשנים">
      {SECTIONS.map(({ id }) => (
        <button
          key={id}
          className={`section-dot${active === id ? ' section-dot--active' : ''}`}
          onClick={() => scrollTo(id)}
          aria-label={id}
        />
      ))}
    </nav>
  );
}
