import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { stopScroll, startScroll } from '../lib/scroll';
import './PlayerOverlay.css';

const MORPH = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

// Sound ON (it's a user click); fastest-starting clean params.
function embedSrc(id) {
  const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  return (
    `https://www.youtube-nocookie.com/embed/${id}` +
    `?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${origin}`
  );
}

function posterFor(work) {
  if (work.thumb && work.thumb.startsWith('/media/')) return work.thumb;
  if (work.youtubeId) return `https://i.ytimg.com/vi/${work.youtubeId}/hqdefault.jpg`;
  return '';
}

// Opens with a shared-layoutId morph out of the clicked card. The iframe mounts
// IMMEDIATELY (autoplay) with the work's poster as a cover that fades out the
// instant playback starts — so it feels like the card became the video, with no
// enlarged-thumbnail flash. Closes with a self-contained fade + unmount.
export function PlayerOverlay({ work, onClose }) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const posterUrl = posterFor(work);
  const [posterHidden, setPosterHidden] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(null);
  const rootRef = useRef(null);
  const iframeRef = useRef(null);
  const closingRef = useRef(false);
  const pushedRef = useRef(false);

  // Fade out (audio stops as the iframe unmounts), then let the parent remove us.
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
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

  // Fade the poster out the instant the video actually plays (YT postMessage
  // state), with a safety-net reveal so the poster never sticks.
  useEffect(() => {
    if (reduce) return undefined;
    const onMsg = (e) => {
      if (typeof e.data !== 'string' || !/youtube/.test(e.origin)) return;
      try {
        const d = JSON.parse(e.data);
        const state = d?.info?.playerState ?? (d.event === 'onStateChange' ? d.info : undefined);
        if (state === 1) setPosterHidden(true);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [reduce]);

  const onIframeLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      '{"event":"listening","id":1,"channel":"widget"}',
      '*'
    );
    setTimeout(() => setPosterHidden(true), 1500);
  };

  const stageInner = (
    <>
      {work.youtubeId ? (
        <iframe
          ref={iframeRef}
          className="player__iframe"
          src={embedSrc(work.youtubeId)}
          title={work.title}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          onLoad={onIframeLoad}
        />
      ) : (
        <div className="player__placeholder">
          <span>הסרטון יתווסף בקרוב</span>
        </div>
      )}
      {posterUrl && work.youtubeId && (
        <div
          className={`player__poster${posterHidden ? ' is-hidden' : ''}`}
          style={{ backgroundImage: `url(${posterUrl})` }}
          aria-hidden="true"
        />
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
