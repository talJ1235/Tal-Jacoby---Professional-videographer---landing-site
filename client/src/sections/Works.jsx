import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { works } from '../data/works';
import { WorkCard } from '../components/WorkCard';
import './Works.css';

const FILTERS = [
  { id: 'all', label: 'הכל' },
  { id: 'events', label: 'אירועים' },
  { id: 'business', label: 'עסקים' },
];

export function Works() {
  const [filter, setFilter] = useState('all');

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const filtered = useMemo(
    () => (filter === 'all' ? works : works.filter((w) => w.category === filter)),
    [filter]
  );

  const handleOpen = (work) => {
    // Player is wired in the next step.
    // eslint-disable-next-line no-console
    console.log('open work', work.id);
  };

  const cardAnim = (index) =>
    reduce
      ? { layout: true }
      : {
          layout: true,
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          exit: { opacity: 0, transition: { duration: 0.2 } },
          viewport: { once: true, margin: '-80px' },
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 },
        };

  return (
    <section id="works" className="works" aria-label="עבודות">
      <div className="works__inner">
        <header className="works__header">
          <span className="works__label">עבודות</span>
          <div className="works__filters" role="tablist" aria-label="סינון עבודות">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={`works__filter${filter === f.id ? ' is-active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="works__grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((work, index) => (
              <WorkCard
                key={work.id}
                work={work}
                index={index}
                onOpen={handleOpen}
                className={index === 0 ? 'workcard--featured' : ''}
                anim={cardAnim(index)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
