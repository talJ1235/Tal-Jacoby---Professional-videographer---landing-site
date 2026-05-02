import { useEffect, useRef } from 'react';
import './Cursor.css';

export function Cursor() {
  const dotRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    let x = 0, y = 0;
    let animFrame;

    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
    };

    const render = () => {
      dot.style.transform = `translate(${x}px, ${y}px)`;
      animFrame = requestAnimationFrame(render);
    };

    const grow = () => dot.classList.add('cursor--grow');
    const shrink = () => dot.classList.remove('cursor--grow');

    document.addEventListener('mousemove', move);
    document.querySelectorAll('a, button, [role="button"]').forEach((el) => {
      el.addEventListener('mouseenter', grow);
      el.addEventListener('mouseleave', shrink);
    });

    animFrame = requestAnimationFrame(render);
    return () => {
      document.removeEventListener('mousemove', move);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return <div ref={dotRef} className="cursor-dot" aria-hidden="true" />;
}
