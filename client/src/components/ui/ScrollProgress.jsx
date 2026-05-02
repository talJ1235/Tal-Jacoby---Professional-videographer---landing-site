import { useEffect, useState } from 'react';
import './ScrollProgress.css';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };

    // passive listener — no performance hit
    document.documentElement.addEventListener('scroll', update, { passive: true });
    return () => document.documentElement.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="scroll-progress" role="progressbar" aria-hidden="true">
      <div className="scroll-progress__bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
