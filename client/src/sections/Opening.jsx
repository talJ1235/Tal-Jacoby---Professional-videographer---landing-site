import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useContent } from '../content/useContent';
import { IS_PREVIEW } from '../content/previewMode';
import './Opening.css';

const SHOWREEL = '/media/showreel/showreel.mp4';
const POSTER = '/media/showreel/poster.jpg';

export function Opening() {
  const { site } = useContent();
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  const reduce =
    IS_PREVIEW ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Pause the video when the section leaves the viewport (battery).
  useEffect(() => {
    if (reduce) return;
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.1) {
          video.pause();
        } else {
          video.play().catch(() => {});
        }
      },
      { threshold: [0, 0.1] }
    );
    io.observe(section);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <section
      ref={sectionRef}
      id="opening"
      className={`opening${videoFailed ? ' opening--fallback' : ''}`}
      aria-label="פתיח"
      style={videoFailed ? { backgroundImage: `url(${POSTER})` } : undefined}
    >
      {!videoFailed && (
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
      )}

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
