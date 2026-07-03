// Runtime content store for the public site.
// Normal visitors: holds the content bundled at build time (no overhead, no
// listeners fire). Preview mode: the lazy previewBridge calls setContent() with
// the editor's live draft, so the real public components re-render from it.
import bundledSite from '@content/site.json';
import bundledWorks from '@content/works.json';

let state = { site: bundledSite, works: bundledWorks };
const listeners = new Set();

export function getContent() {
  return state;
}

export function setContent(next) {
  state = {
    site: next && next.site ? next.site : state.site,
    works: next && next.works ? next.works : state.works,
  };
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
