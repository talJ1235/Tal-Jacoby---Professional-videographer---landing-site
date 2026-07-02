import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { stopScroll, startScroll } from '../lib/scroll';
import './PlayerOverlay.css';

const MORPH = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

function embedSrc(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

// Opens with a shared-layoutId morph out of the clicked card, then fades the
// YouTube iframe in. Closes with a self-contained fade + unmount (no reliance on
// AnimatePresence exit, which hangs when mixed with the shared-layout morph).
export function PlayerOverlay({ work, onClose }) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [iframeReady, setIframeReady] = useState(reduce);
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(null);
  const rootRef = useRef(null);
  const closingRef = useRef(false);
  const pushedRef = useRef(false);

  // Fade out (audio stops as the iframe unmounts), then let the parent remove us.
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIframeReady(false);
    setClosing(true);
    setTimeout(onClose, reduce ? 0 : 200);
  };

  // User-driven close: pop our history entry so the mobile back button and our
  // buttons share one path; the popstate listener runs the actual teardown.
  const dismiss = () => {
    if (closingRef.current) return;
    if (window.history.state && window.history.state.player) window.history.back();
    else close();
  };

  // History integration (guarded so StrictMode's double-invoke pushes only once).
  useEffect(() => {
    if (!pushedRef.current) {
      window.history.pushState({ player: work.id }, '');
      pushedRef.current = true;
    }
    const onPop = () => close();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const focusables = rootRef.current
          ? rootRef.current.querySelectorAll('button, iframe, a[href]')
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
      ref={rootRef}
    >
      <motion.div
        className="player__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: reduce ? 0.2 : closing ? 0.2 : 0.45 }}
        aria-hidden="true"
      />

      <div className="player__stage" onClick={dismiss}>
        {reduce ? (
          <motion.div
            className="player__frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: closing ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {stageInner}
          </motion.div>
        ) : (
          <motion.div
            className="player__frame"
            layoutId={closing ? undefined : `work-${work.id}`}
            animate={{ opacity: closing ? 0 : 1 }}
            transition={closing ? { duration: 0.2 } : MORPH}
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
