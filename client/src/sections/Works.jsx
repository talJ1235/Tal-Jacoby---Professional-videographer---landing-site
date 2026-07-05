import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const VALID_CATEGORIES = ['events', 'business', 'aerial'];

// Defensive: a malformed work (bad shape / missing id / unknown category) is
// skipped rather than allowed to crash the grid.
function isRenderableWork(w) {
  return (
    w &&
    typeof w === 'object' &&
    typeof w.id === 'string' &&
    w.id.length > 0 &&
    typeof w.title === 'string' &&
    VALID_CATEGORIES.includes(w.category)
  );
}

export function Works() {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const openerRef = useRef(null);

  const reduce =
    IS_PREVIEW ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const { works: allWorks } = useContent();
  const published = useMemo(
    () => (Array.isArray(allWorks) ? allWorks : []).filter((w) => isRenderableWork(w) && w.published !== false),
    [allWorks]
  );

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

        {/* One consistent transition for every filter change: the whole grid
            cross-dissolves (keyed by filter). No per-card layout/slide, so all
            directions behave identically; images are cached (stable ids). */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            className="works__grid"
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {filtered.map((work, index) => (
              <WorkCard
                key={work.id}
                work={work}
                index={index}
                onOpen={handleOpen}
                className={index === 0 ? 'workcard--featured' : ''}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {expanded && (
        <PlayerOverlay key={expanded.id} work={expanded} onClose={handleClose} />
      )}
    </section>
  );
}
