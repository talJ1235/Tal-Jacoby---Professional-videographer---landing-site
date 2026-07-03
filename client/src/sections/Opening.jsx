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

  let background = null;
  if (useYoutube && !reduce) {
    background = (
      <div className="opening__yt" aria-hidden="true">
        <iframe
          ref={iframeRef}
          src={ytEmbedSrc(heroYoutubeId)}
          title="רקע וידאו"
          allow="autoplay; encrypted-media"
        />
      </div>
    );
  } else if (useYoutube && reduce) {
    background = (
      <img
        className="opening__bg-img"
        src={`https://i.ytimg.com/vi/${heroYoutubeId}/maxresdefault.jpg`}
        alt=""
        aria-hidden="true"
      />
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
