import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './WorkCard.css';

const MORPH = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

function WorkCardBase({ work, index, onOpen, buttonRef, className = '', anim }) {
  const { id, title, tag, thumb, preview } = work;

  const videoRef = useRef(null);
  const srcSetRef = useRef(false);
  const [active, setActive] = useState(false);   // preview showing / scaled
  const [thumbFailed, setThumbFailed] = useState(false);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Assign the preview src only once, the first time it's needed.
  const ensureSrc = () => {
    const video = videoRef.current;
    if (!video || srcSetRef.current) return;
    video.src = preview;
    srcSetRef.current = true;
  };

  const startPreview = () => {
    if (reduce) return;
    ensureSrc();
    const video = videoRef.current;
    if (video) video.play().catch(() => {});
    setActive(true);
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (video) video.pause();
    setActive(false);
  };

  // Fine pointers: hover drives the preview. Coarse pointers: visibility does.
  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) return;

    const el = videoRef.current?.closest('.workcard__media');
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) startPreview();
        else stopPreview();
      },
      { threshold: [0, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const fineHover = () => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) startPreview();
  };
  const fineLeave = () => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) stopPreview();
  };

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      className={`workcard ${className}`.trim()}
      onClick={() => onOpen(work)}
      onMouseEnter={fineHover}
      onMouseLeave={fineLeave}
      aria-label={`${title} — פתח נגן`}
      {...anim}
    >
      <motion.div className="workcard__media" layoutId={`work-${id}`} transition={MORPH}>
        <div className={`workcard__media-inner${active ? ' is-active' : ''}`}>
          {!thumbFailed && (
            <img
              className="workcard__thumb"
              src={thumb}
              alt={title}
              loading={index < 2 ? 'eager' : 'lazy'}
              decoding="async"
              onError={() => setThumbFailed(true)}
            />
          )}
          <video
            ref={videoRef}
            className={`workcard__preview${active ? ' is-active' : ''}`}
            muted
            loop
            playsInline
            preload="none"
          />
        </div>
      </motion.div>

      <div className="workcard__meta">
        <div className={`workcard__title${active ? ' is-active' : ''}`}>{title}</div>
        <div className="workcard__tag">{tag}</div>
      </div>
    </motion.button>
  );
}

export const WorkCard = memo(WorkCardBase);
