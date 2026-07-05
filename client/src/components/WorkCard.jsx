import { forwardRef, memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IS_PREVIEW } from '../content/previewMode';
import { loadYouTubeApi } from '../lib/youtubeApi';
import './WorkCard.css';

const MORPH = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

// Warm YouTube once (on hover / card visibility): preconnect the player hosts
// AND pre-load the IFrame Player API so the first card click starts fast.
let ytWarmed = false;
function warmYouTube() {
  if (ytWarmed || typeof document === 'undefined') return;
  ytWarmed = true;
  for (const href of [
    'https://www.youtube.com',
    'https://s.ytimg.com',
    'https://i.ytimg.com',
  ]) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = '';
    document.head.appendChild(link);
  }
  loadYouTubeApi(); // have the API ready before the click
}

function WorkCardBase({ work, index, onOpen, className = '', anim }, ref) {
  const { id, title, tag, thumb, preview, youtubeId } = work;

  // Thumbnail precedence: uploaded local thumb.webp (work.thumb points at a
  // /media path only when a still was actually uploaded) → YouTube hqdefault →
  // gray box. hqdefault always exists and loads fast; maxres is avoided (slow/
  // often missing = the "black box"). onError degrades local→YouTube gracefully.
  const localThumb = thumb && thumb.startsWith('/media/') ? thumb : '';
  const ytHq = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : '';

  const videoRef = useRef(null);
  const srcSetRef = useRef(false);
  const [active, setActive] = useState(false);   // preview showing / scaled
  const [imgSrc, setImgSrc] = useState(localThumb || ytHq);
  const [thumbFailed, setThumbFailed] = useState(!localThumb && !ytHq);

  const handleImgError = () => {
    if (imgSrc === localThumb && ytHq) setImgSrc(ytHq); // uploaded missing → YouTube
    else setThumbFailed(true);                          // nothing loads → gray box
  };

  const reduce =
    IS_PREVIEW ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const hasPreview = preview && preview.startsWith('/media/');

  // Assign the preview src only once, the first time it's needed.
  const ensureSrc = () => {
    const video = videoRef.current;
    if (!video || srcSetRef.current) return;
    video.src = preview;
    srcSetRef.current = true;
  };

  const startPreview = () => {
    if (reduce || !hasPreview) return;
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
        if (entry.intersectionRatio >= 0.6) {
          warmYouTube();
          startPreview();
        } else {
          stopPreview();
        }
      },
      { threshold: [0, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const fineHover = () => {
    warmYouTube();
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
              src={imgSrc}
              alt={title}
              width="1600"
              height="900"
              loading={index < 2 ? 'eager' : 'lazy'}
              fetchpriority={index < 2 ? 'high' : 'auto'}
              decoding="async"
              onError={handleImgError}
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
