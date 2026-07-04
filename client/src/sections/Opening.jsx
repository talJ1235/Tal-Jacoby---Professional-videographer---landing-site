import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useContent } from '../content/useContent';
import { IS_PREVIEW } from '../content/previewMode';
import './Opening.css';

const SHOWREEL = '/media/showreel/showreel.mp4';
const POSTER = '/media/showreel/poster.jpg';

// Muted, looping, controls-free YouTube background embed.
function ytEmbedSrc(id) {
  const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  return (
    `https://www.youtube-nocookie.com/embed/${id}` +
    `?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1` +
    `&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&origin=${origin}`
  );
}

export function Opening() {
  const { site } = useContent();
  const heroYoutubeId = site.heroYoutubeId || '';
  const useYoutube = !!heroYoutubeId;

  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterHidden, setPosterHidden] = useState(false);
  const [posterIdx, setPosterIdx] = useState(0);

  const posterCandidates = useYoutube
    ? [
        `https://i.ytimg.com/vi/${heroYoutubeId}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${heroYoutubeId}/hqdefault.jpg`,
      ]
    : [];

  const reduce =
    IS_PREVIEW ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Pause the background when the hero leaves the viewport (battery).
  useEffect(() => {
    if (reduce) return;
    const section = sectionRef.current;
    if (!section) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.intersectionRatio >= 0.1;
        if (useYoutube) {
          const win = iframeRef.current?.contentWindow;
          if (win) {
            win.postMessage(
              JSON.stringify({ event: 'command', func: visible ? 'playVideo' : 'pauseVideo', args: [] }),
              '*'
            );
          }
        } else {
          const v = videoRef.current;
          if (!v) return;
          if (visible) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: [0, 0.1] }
    );
    io.observe(section);
    return () => io.disconnect();
  }, [reduce, useYoutube]);

  // Reveal the video (fade the poster out) only once it's actually PLAYING —
  // YouTube's iframe onLoad fires at chrome-load (black + spinner), too early.
  // Listen for the embed's postMessage state event; fall back after 2s.
  useEffect(() => {
    if (reduce || !useYoutube) return undefined;
    const onMsg = (e) => {
      if (typeof e.data !== 'string' || !/youtube/.test(e.origin)) return;
      try {
        const d = JSON.parse(e.data);
        const state = d?.info?.playerState ?? (d.event === 'onStateChange' ? d.info : undefined);
        if (state === 1) setPosterHidden(true); // 1 = playing
      } catch {
        /* ignore non-JSON messages */
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [reduce, useYoutube]);

  const onIframeLoad = () => {
    // register for YT events, and a safety-net reveal in case none arrive
    iframeRef.current?.contentWindow?.postMessage(
      '{"event":"listening","id":1,"channel":"widget"}',
      '*'
    );
    setTimeout(() => setPosterHidden(true), 2000);

    // Counter YouTube autoplay's "scroll the playing iframe into view" for a
    // short window on load — but stop the moment the user scrolls themselves.
    let userScrolled = false;
    const markUser = () => { userScrolled = true; };
    window.addEventListener('wheel', markUser, { passive: true, once: true });
    window.addEventListener('touchmove', markUser, { passive: true, once: true });
    window.addEventListener('keydown', markUser, { once: true });
    let ticks = 0;
    const iv = setInterval(() => {
      if (userScrolled || ticks++ > 12) {
        clearInterval(iv);
        return;
      }
      if (window.scrollY > 0 && window.scrollY < window.innerHeight * 1.5) {
        window.scrollTo(0, 0);
      }
    }, 100);
  };

  let background = null;
  if (useYoutube) {
    // The poster sits ON TOP and covers YouTube's black loading state; it fades
    // out to reveal the playing video. Reduced-motion: poster only, no autoplay.
    background = (
      <div className="opening__yt" aria-hidden="true">
        {!reduce && (
          <iframe
            ref={iframeRef}
            className="opening__yt-frame"
            src={ytEmbedSrc(heroYoutubeId)}
            title="רקע וידאו"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            aria-hidden="true"
            onLoad={onIframeLoad}
          />
        )}
        {posterIdx < posterCandidates.length && (
          <img
            className={`opening__yt-poster${posterHidden ? ' is-hidden' : ''}`}
            src={posterCandidates[posterIdx]}
            alt=""
            onError={() => setPosterIdx((i) => i + 1)}
          />
        )}
      </div>
    );
  } else if (!videoFailed) {
    background = (
      <video
        ref={videoRef}
        className="opening__video"
        src={SHOWREEL}
        poster={POSTER}
        autoPlay={!reduce}
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setVideoFailed(true)}
      />
    );
  }

  const showreelFallback = !useYoutube && videoFailed;

  return (
    <section
      ref={sectionRef}
      id="opening"
      className={`opening${showreelFallback ? ' opening--fallback' : ''}`}
      aria-label="פתיח"
      style={showreelFallback ? { backgroundImage: `url(${POSTER})` } : undefined}
    >
      {background}

      <div className="opening__scrim" aria-hidden="true" />

      <motion.div
        className="opening__text"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      >
        <h1 className="opening__name">{site.heroName}</h1>
        <p className="opening__sub">{site.heroSubtitle}</p>
      </motion.div>

      {!reduce && <div className="opening__cue" aria-hidden="true" />}
    </section>
  );
}
