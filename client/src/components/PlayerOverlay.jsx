import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { stopScroll, startScroll } from '../lib/scroll';
import { loadYouTubeApi } from '../lib/youtubeApi';
import './PlayerOverlay.css';

// Slow, cinematic card→fullscreen grow (~0.9s). The card expands into a dark
// player frame — no thumbnail is ever shown enlarged; the growing frame + its
// subtle "powering-on" shimmer IS the loading screen, so YouTube's cold-start
// happens entirely inside the animation and the reveal feels like the frame
// resolving into the video.
const MORPH = { duration: 0.9, ease: [0.22, 1, 0.36, 1] };

// Timestamped player instrumentation. Enable on any device by opening the page
// with ?ytdebug=1 (or localStorage.ytDebug = '1'), then read the console.
const DEBUG =
  typeof window !== 'undefined' &&
  (/[?&]ytdebug=1/.test(window.location.search) ||
    (() => {
      try {
        return window.localStorage.getItem('ytDebug') === '1';
      } catch {
        return false;
      }
    })());

const YT_STATE = { '-1': 'unstarted', 0: 'ended', 1: 'PLAYING', 2: 'paused', 3: 'buffering', 5: 'cued' };

// Opens with a shared-layoutId morph out of the clicked card. Uses the YouTube
// IFrame Player API (not a bare embed). The poster cover is removed on the
// EARLIEST real-playback signal — the PLAYING state event OR getCurrentTime
// first advancing past 0 (whichever fires first) — never a blind timer, so the
// reveal lands on the true first painted frame and never mid-clip. seekTo(0)
// forces the true start. Sound on (the card click is the unmute gesture).
export function PlayerOverlay({ work, onClose }) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // Create the YT.Player. The poster is removed on the earliest real-playback
  // signal: a short getCurrentTime poll (fires the instant the clip advances
  // past 0 = first painted frame) races the PLAYING state event. A long 10s
  // net only covers a genuine playback failure — it is NOT the normal path, so
  // a missed event can no longer reveal a mid-clip frame.
  useEffect(() => {
    if (!work.youtubeId || !videoHostRef.current) return undefined;
    let cancelled = false;
    let poll = null;
    const t0 = performance.now();
    const ms = () => `${Math.round(performance.now() - t0)}ms`;
    const log = (...a) => DEBUG && console.log('[player]', ms(), ...a);

    log('open', work.id, 'youtubeId', work.youtubeId);

    let revealed = false;
    const reveal = (why) => {
      if (cancelled || revealed) return;
      revealed = true;
      if (poll) { clearInterval(poll); poll = null; }
      clearTimeout(failNet);
      log('POSTER REMOVED (open→first-frame)', 'via', why);
      setPosterHidden(true);
    };

    // True-failure net only (autoplay blocked / API never loads). Long enough
    // that it never fires on a normal successful start.
    const failNet = setTimeout(() => reveal('10s-failsafe'), 10000);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !YT || !videoHostRef.current) return;
      log('YT API ready → creating player');
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
            log('onReady');
            try {
              e.target.seekTo(0, true); // guarantee the true beginning
              e.target.playVideo();
            } catch {
              /* ignore */
            }
            // Poll for the first advancing frame — the earliest reliable paint
            // signal, usually ahead of (or at) the PLAYING event.
            if (poll) clearInterval(poll);
            poll = setInterval(() => {
              let ct = 0;
              try { ct = e.target.getCurrentTime() || 0; } catch { /* ignore */ }
              if (ct > 0.04) {
                if (ct > 1.2) { try { e.target.seekTo(0, true); } catch { /* ignore */ } }
                reveal(`currentTime=${ct.toFixed(2)}s`);
              }
            }, 40);
          },
          onStateChange: (e) => {
            log('state', e.data, YT_STATE[e.data] || '?');
            if (e.data === 1) {
              if (!unmutedRef.current) {
                unmutedRef.current = true;
                try { e.target.unMute(); } catch { /* ignore */ }
              }
              reveal('PLAYING-event'); // 1 = PLAYING → first frame is painting
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(failNet);
      if (poll) clearInterval(poll);
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
      {/* Loading surface — a NEUTRAL dark plate (no thumbnail, no image of any
          kind) with a subtle "powering-on" shimmer. It hides YouTube's black
          cold-start and fades out the instant the first video frame paints, so
          the open is one continuous motion: card → dark frame → video. */}
      {work.youtubeId && (
        <div
          className={`player__cover${posterHidden ? ' is-hidden' : ''}`}
          aria-hidden="true"
        >
          <span className="player__shimmer" />
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
