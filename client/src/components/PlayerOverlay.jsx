import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { stopScroll, startScroll } from '../lib/scroll';
import { loadYouTubeApi } from '../lib/youtubeApi';
import './PlayerOverlay.css';

const MORPH = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

function posterFor(work) {
  if (work.thumb && work.thumb.startsWith('/media/')) return work.thumb;
  if (work.youtubeId) return `https://i.ytimg.com/vi/${work.youtubeId}/hqdefault.jpg`;
  return '';
}

// Opens with a shared-layoutId morph out of the clicked card. Uses the YouTube
// IFrame Player API (not a bare embed): the poster cover is removed the instant
// the player fires PLAYING, and the clip is forced to its true start (seekTo 0)
// — no early thumbnail flash, no late/mid-clip start. Sound on (user click).
export function PlayerOverlay({ work, onClose }) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const posterUrl = posterFor(work);
  const [posterHidden, setPosterHidden] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(null);
  const rootRef = useRef(null);
  const videoHostRef = useRef(null);
  const playerRef = useRef(null);
  const unmutedRef = useRef(false);
  const closingRef = useRef(false);
  const pushedRef = useRef(false);

  // Fade out (stop the audio immediately), then let the parent remove us.
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    try {
      playerRef.current?.stopVideo?.();
    } catch {
      /* ignore */
    }
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

  // Create the YT.Player. Poster is removed ON the PLAYING event; a 4s safety
  // net reveals it if that never arrives (autoplay blocked / API failure).
  useEffect(() => {
    if (!work.youtubeId || !videoHostRef.current) return undefined;
    let cancelled = false;
    const fallback = setTimeout(() => setPosterHidden(true), 4000);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !YT || !videoHostRef.current) return;
      const host = document.createElement('div');
      videoHostRef.current.appendChild(host);
      playerRef.current = new YT.Player(host, {
        videoId: work.youtubeId,
        playerVars: {
          autoplay: 1,
          mute: 1, // muted autoplay always starts; we unmute on PLAYING for sound
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: 0,
          controls: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            try {
              e.target.seekTo(0, true); // guarantee the true beginning
              e.target.playVideo();
            } catch {
              /* ignore */
            }
          },
          onStateChange: (e) => {
            if (e.data === 1) {
              // sound on (the card click is the user gesture that allows unmute)
              if (!unmutedRef.current) {
                unmutedRef.current = true;
                try { e.target.unMute(); } catch { /* ignore */ }
              }
              setPosterHidden(true); // 1 = PLAYING → remove poster on the event
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageInner = (
    <>
      {work.youtubeId ? (
        <div className="player__video" ref={videoHostRef} />
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
