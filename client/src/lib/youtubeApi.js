// Loads the YouTube IFrame Player API once and resolves with window.YT.
// Call it early (on card hover / visibility) so the first click is fast.
// The script is injected at runtime — it never ships in the app bundle.
let ytPromise = null;

export function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (ytPromise) return ytPromise;

  ytPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    // Chain in case something else also set the global callback.
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(window.YT);
    };
    if (!document.querySelector('script[data-yt-api]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.setAttribute('data-yt-api', '');
      document.head.appendChild(tag);
    }
  });
  return ytPromise;
}
