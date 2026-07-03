// Lazy-loaded ONLY when ?preview=1 (dynamic import in main.jsx), so it never
// ships to normal visitors. Receives the editor's draft via postMessage and
// pushes it into the content store; announces readiness to the parent.
import { setContent } from './contentStore';

window.addEventListener('message', (e) => {
  if (e.origin !== window.location.origin) return; // same-origin only
  const d = e.data;
  if (d && d.type === 'preview:content') {
    setContent({ site: d.site, works: d.works });
  }
});

// Tell the editor we're ready to receive content.
if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'preview:ready' }, window.location.origin);
}
