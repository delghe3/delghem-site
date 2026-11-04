/* DÈLGHEM Alpha: genuine post-introduction video playback.
   The media source is intentionally attached ONLY when the splash completes.
   Browsers generally allow muted inline autoplay; an accessible fallback
   remains available if a local policy or low-power setting blocks it. */
(() => {
  'use strict';
  const video = document.getElementById('alpha-demo-video');
  if (!video) return;
  const source = video.querySelector('source[data-src]');
  const fallback = document.getElementById('alpha-demo-play-fallback');
  let activated = false;

  function rate() {
    video.defaultPlaybackRate = 2;
    video.playbackRate = 2;
  }
  function requestPlayback() {
    rate();
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        if (fallback) fallback.hidden = false;
      });
    }
  }
  function start() {
    if (activated) return;
    activated = true;
    video.defaultMuted = true;
    video.muted = true;
    rate();
    video.addEventListener('loadedmetadata', rate, { once: true });
    video.addEventListener('play', rate);
    if (source && !source.src) {
      source.src = source.dataset.src;
      video.preload = 'auto';
      video.load();
    }
    requestPlayback();
  }

  fallback?.addEventListener('click', () => {
    fallback.hidden = true;
    requestPlayback();
  });
  document.addEventListener('delghem:intro-complete', start, { once: true });

  // For pages where the splash has already been dismissed, including
  // reduced-motion settings and navigation restoring from the bfcache.
  if (!document.getElementById('site-intro')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('site-intro')) start();
      }, { once: true });
    } else {
      start();
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', () => {
      if (!document.getElementById('site-intro')) start();
    });
  }
})();
