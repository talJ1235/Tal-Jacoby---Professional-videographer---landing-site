import { forwardRef, memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IS_PREVIEW } from '../content/previewMode';
import './WorkCard.css';

const MORPH = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

function WorkCardBase({ work, index, onOpen, className = '', anim }, ref) {
  const { id, title, tag, thumb, preview, youtubeId } = work;

  // Thumbnail chain: local WebP → YouTube hqdefault → gray box.
  // hqdefault always exists and loads fast; maxresdefault is intentionally NOT
  // used (slower and often missing → the "black box" while it 404s/loads).
  // An uploaded graded still (thumb.webp) overrides YouTube automatically.
  const thumbCandidates = [];
  if (thumb) thumbCandidates.push(thumb);
  if (youtubeId) {
    thumbCandidates.push(`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`);
  }

  const videoRef = useRef(null);
  const srcSetRef = useRef(false);
  const [active, setActive] = useState(false);   // preview showing / scaled
  const [srcIdx, setSrcIdx] = useState(0);
  const thumbFailed = srcIdx >= thumbCandidates.length;

  const reduce =
    IS_PREVIEW ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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
      ref={ref}
      type="button"
      className={`workcard ${className}`.trim()}
      onClick={(e) => onOpen(work, e.currentTarget)}
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
              src={thumbCandidates[srcIdx]}
              alt={title}
              width="1280"
              height="720"
              loading={index < 2 ? 'eager' : 'lazy'}
              fetchpriority={index < 2 ? 'high' : 'auto'}
              decoding="async"
              onError={() => setSrcIdx((i) => i + 1)}
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

export const WorkCard = memo(forwardRef(WorkCardBase));
