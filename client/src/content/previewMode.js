// True when the public app is rendered inside the editor's preview iframe
// (URL flag ?preview=1). Used to disable Lenis/entrance animations/autoplay so
// draft changes reflect instantly. A plain constant — no bundle cost for others.
export const IS_PREVIEW =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('preview') === '1';
