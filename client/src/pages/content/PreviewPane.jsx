import { useEffect, useRef, useState } from 'react';

const MODES = {
  desktop: { w: 1280, h: 800, label: 'מחשב' },
  mobile: { w: 375, h: 780, label: 'מובייל' },
};

const PREVIEW_URL = () => `${window.location.origin}/?preview=1`;

// Live preview of the real public site, rendered from the editor's DRAFT via
// postMessage into a same-origin iframe (/?preview=1). Scaled to fit the column.
// If framing is blocked (e.g. a CSP change), a fallback offers a new-tab preview.
export function PreviewPane({ draft }) {
  const iframeRef = useRef(null);
  const wrapRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const readyRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
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
        readyRef.current = true;
        setReady(true);
        setFailed(false);
        send();
      }
    };
    window.addEventListener('message', onMsg);
    // If framing is blocked, the handshake never arrives → show fallback.
    const timer = setTimeout(() => {
      if (!readyRef.current) setFailed(true);
    }, 4000);
    return () => {
      window.removeEventListener('message', onMsg);
      clearTimeout(timer);
    };
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
        {failed ? (
          <div className="ce-preview__fallback">
            <p>לא ניתן להציג את התצוגה המקדימה כאן.</p>
            <button
              type="button"
              className="ce-preview__fallback-btn"
              onClick={() => window.open(PREVIEW_URL(), '_blank', 'noopener')}
            >
              פתח תצוגה מקדימה בכרטיסייה חדשה
            </button>
          </div>
        ) : (
          <div className="ce-preview__scaler" style={{ width: w * scale, height: h * scale }}>
            <iframe
              ref={iframeRef}
              src="/?preview=1"
              title="תצוגה מקדימה של האתר"
              onLoad={send}
              style={{ width: w, height: h, transform: `scale(${scale})` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
