import { useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useContent } from '../content/useContent';
import { IS_PREVIEW } from '../content/previewMode';
import { WorkCard } from '../components/WorkCard';
import { PlayerOverlay } from '../components/PlayerOverlay';
import './Works.css';

const FILTERS = [
  { id: 'all', label: 'הכל' },
  { id: 'events', label: 'אירועים' },
  { id: 'business', label: 'עסקים' },
  { id: 'aerial', label: 'אווירי' },
];

export function Works() {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const openerRef = useRef(null);

  const reduce =
    IS_PREVIEW ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const { works: allWorks } = useContent();
  const published = useMemo(() => allWorks.filter((w) => w.published !== false), [allWorks]);

  const filtered = useMemo(
    () => (filter === 'all' ? published : published.filter((w) => w.category === filter)),
    [filter, published]
  );

  const handleOpen = (work, el) => {
    openerRef.current = el || document.activeElement;
    setExpanded(work);
  };

  const handleClose = () => {
    // Return focus to the card that opened the player, after the overlay has
    // unmounted (otherwise the removed close button drops focus back to body).
    const opener = openerRef.current;
    setExpanded(null);
    if (opener && typeof opener.focus === 'function') {
      setTimeout(() => opener.focus(), 60);
    }
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

      {expanded && (
        <PlayerOverlay key={expanded.id} work={expanded} onClose={handleClose} />
      )}
    </section>
  );
}
