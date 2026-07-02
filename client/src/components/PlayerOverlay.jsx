import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { stopScroll, startScroll } from '../lib/scroll';
import './PlayerOverlay.css';

const MORPH = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

function embedSrc(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

export function PlayerOverlay({ work, onClose }) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [iframeReady, setIframeReady] = useState(reduce); // crossfade shows iframe at once
  const closeRef = useRef(null);
  const stageRef = useRef(null);
  const closingRef = useRef(false);

  // Teardown: fade the iframe out (audio stops), then let the parent unmount us.
  const teardown = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIframeReady(false);
    setTimeout(onClose, reduce ? 0 : 150);
  };

  // History integration: opening pushes a state; any close goes through popstate,
  // so the mobile back button and our own buttons share one path.
  useEffect(() => {
    window.history.pushState({ player: work.id }, '');
    const onPop = () => teardown();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    if (closingRef.current) return;
    window.history.back(); // fires popstate → teardown
  };

  // Scroll lock + focus management.
  useEffect(() => {
    stopScroll();
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
      } else if (e.key === 'Tab') {
        // minimal focus trap within the overlay
        const focusables = stageRef.current
          ? stageRef.current.querySelectorAll('button, iframe, a[href]')
          : [];
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      startScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageInner = (
    <>
      <div
        className="player__poster"
        style={{ backgroundImage: `url(${work.thumb})` }}
        aria-hidden="true"
      />
      {work.youtubeId ? (
        iframeReady && (
          <motion.iframe
            className="player__iframe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            src={embedSrc(work.youtubeId)}
            title={work.title}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        )
      ) : (
        <div className="player__placeholder">
          <span>הסרטון יתווסף בקרוב</span>
        </div>
      )}
    </>
  );

  return (
    <div
      className="player"
      role="dialog"
      aria-modal="true"
      aria-label={work.title}
    >
      <motion.div
        className="player__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.2 : 0.45 }}
        onClick={dismiss}
      />

      <div className="player__stage" ref={stageRef}>
        {reduce ? (
          <motion.div
            className="player__frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {stageInner}
          </motion.div>
        ) : (
          <motion.div
            className="player__frame"
            layoutId={`work-${work.id}`}
            transition={MORPH}
            onLayoutAnimationComplete={() => setIframeReady(true)}
            onClick={(e) => e.stopPropagation()}
          >
            {stageInner}
          </motion.div>
        )}
      </div>

      <button
        type="button"
        className="player__close"
        onClick={dismiss}
        aria-label="סגור"
        ref={closeRef}
      >
        ✕
      </button>
    </div>
  );
}
