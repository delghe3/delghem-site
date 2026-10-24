/* DÈLGHEM sharing: all promotion is user-initiated. No analytics or automatic posts. */
(() => {
  'use strict';
  const section = document.getElementById('share');
  if (!section) return;
  const link = document.documentElement.lang === 'en'
    ? 'https://www.delghe.com/en/' : 'https://www.delghe.com/';
  const text = document.documentElement.lang === 'en'
    ? 'DÈLGHEM — Native structural analysis for Apple Silicon. vAlpha1 planned for January 2027.'
    : 'DÈLGHEM — Calcolo strutturale nativo per Apple Silicon. vAlpha1 prevista a gennaio 2027.';
  const share = section.querySelector('[data-share-action="native"]');
  const copy = section.querySelector('[data-share-action="copy"]');
  const alertCopy = async (button) => {
    try {
      await navigator.clipboard.writeText(link);
      const old = button.textContent;
      button.textContent = button.dataset.copyDone || 'Link copied';
      setTimeout(() => { button.textContent = old; }, 2100);
    } catch (_) {
      window.prompt(document.documentElement.lang === 'en' ? 'Copy this link' : 'Copia questo link', link);
    }
  };
  copy?.addEventListener('click', () => { void alertCopy(copy); });
  share?.addEventListener('click', async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'DÈLGHEM', text, url: link }); }
      catch (err) { if (err?.name !== 'AbortError') void alertCopy(copy); }
    } else { void alertCopy(copy); }
  });
})();
