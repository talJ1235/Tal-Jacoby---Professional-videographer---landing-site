import { useEffect, useRef, useState } from 'react';

const MODES = {
  desktop: { w: 1280, h: 800, label: 'מחשב' },
  mobile: { w: 375, h: 780, label: 'מובייל' },
};

// Live preview of the real public site, rendered from the editor's DRAFT via
// postMessage into an iframe loaded at /?preview=1. Scaled to fit the column.
export function PreviewPane({ draft }) {
  const iframeRef = useRef(null);
  const wrapRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState('desktop');
  const [scale, setScale] = useState(1);

  const send = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      { type: 'preview:content', site: draftRef.current.site, works: draftRef.current.works },
      window.location.origin
    );
  };

  // Handshake: the preview iframe announces readiness, then we push the draft.
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data && e.data.type === 'preview:ready') {
        setReady(true);
        send();
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Push draft on every change once ready.
  useEffect(() => {
    if (ready) send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, ready]);

  // Scale the fixed logical viewport to fit the available column width.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const recompute = () => setScale(Math.min(1, el.clientWidth / MODES[mode].w));
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const { w, h } = MODES[mode];

  return (
    <div className="ce-preview">
      <div className="ce-preview__bar">
        <span>תצוגה מקדימה חיה</span>
        <div className="ce-preview__modes">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              type="button"
              className={mode === key ? 'is-active' : ''}
              onClick={() => setMode(key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ce-preview__wrap" ref={wrapRef}>
        <div className="ce-preview__scaler" style={{ width: w * scale, height: h * scale }}>
          <iframe
            ref={iframeRef}
            src="/?preview=1"
            title="תצוגה מקדימה של האתר"
            onLoad={send}
            style={{ width: w, height: h, transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
