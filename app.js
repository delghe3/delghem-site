import { messages as dictionaries } from './locales.js';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const italian = dictionaries.it;
const assetUrl = name => new URL(name, import.meta.url).href;

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing may disable storage. */ } },
};
let language = document.documentElement.lang === 'en' ? 'en' : 'it';
let currentGallery = 'model';
let dialogSource = 'gallery';
let dialogReturnFocus = null;
const mediaPreference = matchMedia('(prefers-reduced-motion: reduce)');
let motion = storage.get('delghem-motion') !== 'off' && !mediaPreference.matches;
let modelRotation = true;
let modelStage = null;
let presentationActive = false;
let presentationIndex = 0;
const chapters = $$('.chapter');
const gallery = {
  model: { src: assetUrl('./assets/app-model.png'), title: 'modelCaptionTitle', caption: 'modelCaption', alt: 'modelImageAlt' },
  results: { src: assetUrl('./assets/app-results.png'), title: 'resultsCaptionTitle', caption: 'resultsCaption', alt: 'resultsImageAlt' },
  drawings: { src: assetUrl('./assets/app-drawings.png'), title: 'drawingsCaptionTitle', caption: 'drawingsCaption', alt: 'drawingsImageAlt' },
};

function t(key) { return dictionaries[language][key] ?? italian[key] ?? key; }
function textOnly(value) { const span = document.createElement('span'); span.innerHTML = value; return span.textContent; }

function renderGallery() {
  const item = gallery[currentGallery];
  const picture = $('#gallery-image');
  if (picture.getAttribute('src') !== item.src) picture.src = item.src;
  picture.alt = t(item.alt);
  $('#gallery-title').textContent = textOnly(t(item.title));
  $('#gallery-caption').textContent = textOnly(t(item.caption));
  $('#gallery-panel').setAttribute('aria-labelledby', `tab-${currentGallery}`);
  $$('[data-gallery]').forEach(button => {
    const selected = button.dataset.gallery === currentGallery;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  if ($('#image-dialog').open) updateDialogImage();
}

function updateLanguage(next) {
  language = dictionaries[next] ? next : 'it';
  document.documentElement.lang = language;
  $$('[data-i18n]').forEach(node => { node.innerHTML = t(node.dataset.i18n); });
  $$('[data-i18n-aria]').forEach(node => node.setAttribute('aria-label', textOnly(t(node.dataset.i18nAria))));
  $$('[data-i18n-alt]').forEach(node => { node.alt = textOnly(t(node.dataset.i18nAlt)); });
  document.title = t('seoTitle');
  $('meta[name="description"]').content = t('seoDescription');
  $('meta[property="og:title"]').content = document.title;
  $('meta[property="og:description"]').content = $('meta[name="description"]').content;
  $('meta[property="og:locale"]').content = language === 'it' ? 'it_IT' : 'en_GB';
  $$('.contact-email').forEach(link => { link.href = 'mailto:ildelghe3@gmail.com?subject=' + encodeURIComponent(language === 'it' ? 'Informazioni su DÈLGHEM' : 'DÈLGHEM enquiry'); });
  $('#genius-image').src = assetUrl(language === 'en' ? './assets/app-genius-en.png' : './assets/app-genius-large.png');
  renderGallery();
  renderMotion();
  updateMenuLabel();
}

// Real links remain usable without JavaScript; retain the current section when switching.
function updateLanguageLinks() {
  $$('[data-language]').forEach(link => {
    const target = new URL(link.dataset.baseHref || link.getAttribute('href'), location.href);
    if (!link.dataset.baseHref) link.dataset.baseHref = link.getAttribute('href');
    target.hash = location.hash;
    link.href = target.href;
  });
}
updateLanguageLinks();
window.addEventListener('hashchange', updateLanguageLinks);

function setGallery(name) {
  if (!gallery[name]) return;
  currentGallery = name;
  renderGallery();
}
$$('[data-gallery]').forEach(button => button.addEventListener('click', () => setGallery(button.dataset.gallery)));
$$('[data-gallery-link]').forEach(link => link.addEventListener('click', () => setGallery(link.dataset.galleryLink)));
$('.gallery-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  const keys = Object.keys(gallery);
  const index = keys.indexOf(currentGallery);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
  setGallery(keys[next]);
  $(`[data-gallery="${keys[next]}"]`).focus();
});

function updateDialogImage() {
  const item = dialogSource === 'genius' ? {src: $('#genius-image').getAttribute('src'), alt: 'geniusAlt', title: 'geniusCaption'} : gallery[currentGallery];
  $('#dialog-image').src = item.src;
  $('#dialog-image').alt = t(item.alt);
  $('#dialog-caption').textContent = `${textOnly(t(item.title))} — ${textOnly(t('realScreenshot'))}`;
}
$('#enlarge-image').addEventListener('click', () => {
  dialogSource = 'gallery';
  dialogReturnFocus = $('#enlarge-image');
  updateDialogImage();
  $('#image-dialog').showModal();
  document.body.style.overflow = 'hidden';
});
function openGeniusImage(event) {
  dialogSource = 'genius';
  dialogReturnFocus = event.currentTarget;
  updateDialogImage();
  $('#image-dialog').showModal();
  document.body.style.overflow = 'hidden';
}
$('#open-genius').addEventListener('click', openGeniusImage);
$('#enlarge-genius').addEventListener('click', openGeniusImage);
$('#close-dialog').addEventListener('click', () => $('#image-dialog').close());
$('#image-dialog').addEventListener('close', () => { document.body.style.overflow = ''; dialogReturnFocus?.focus(); });
$('#image-dialog').addEventListener('click', event => { if (event.target === $('#image-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });

function updateMenuLabel() { $('#menu-toggle').setAttribute('aria-label', t($('#menu-toggle').getAttribute('aria-expanded') === 'true' ? 'closeMenu' : 'openMenu')); }
function closeMenu() { $('#mobile-menu').hidden = true; $('#menu-toggle').setAttribute('aria-expanded', 'false'); updateMenuLabel(); }
$('#menu-toggle').addEventListener('click', () => { const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true'; $('#mobile-menu').hidden = !open; $('#menu-toggle').setAttribute('aria-expanded', String(open)); updateMenuLabel(); });
$$('a', $('#mobile-menu')).forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (innerWidth > 600) closeMenu(); }, { passive: true });

function renderMotion() {
  const enabled = motion && !mediaPreference.matches;
  document.documentElement.classList.toggle('motion-reduced', !enabled);
  $('#motion-toggle').setAttribute('aria-pressed', String(enabled));
  $('#motion-toggle').disabled = mediaPreference.matches;
  $('#motion-label').textContent = t(mediaPreference.matches ? 'motionSystem' : enabled ? 'motionOn' : 'motionOff');
  $('#rotate-model').disabled = !enabled;
  modelStage?.setMotion(enabled && modelRotation);
}
$('#rotate-model').addEventListener('click', () => { modelRotation = !modelRotation; renderMotion(); });
$('#motion-toggle').addEventListener('click', () => {
  if (mediaPreference.matches) return;
  motion = !motion;
  storage.set('delghem-motion', motion ? 'on' : 'off');
  renderMotion();
});
mediaPreference.addEventListener('change', () => {
  motion = storage.get('delghem-motion') !== 'off' && !mediaPreference.matches;
  renderMotion();
});

function presentationGo(index) {
  presentationIndex = Math.min(chapters.length - 1, Math.max(0, index));
  chapters[presentationIndex].scrollIntoView({ behavior: motion && !mediaPreference.matches ? 'smooth' : 'instant', block: 'start' });
  updatePresentationPosition();
}
function updatePresentationPosition() {
  $('#presentation-position').textContent = `${presentationIndex + 1} / ${chapters.length}`;
  $('#presentation-prev').disabled = presentationIndex === 0;
  $('#presentation-next').disabled = presentationIndex === chapters.length - 1;
}
function closePresentation() { presentationActive = false; $('#presentation-controls').hidden = true; document.body.classList.remove('presentation-active'); $('#start-presentation').focus({ preventScroll: true }); }
$('#start-presentation').addEventListener('click', () => { presentationActive = true; $('#presentation-controls').hidden = false; document.body.classList.add('presentation-active'); presentationGo(0); $('#presentation-next').focus({ preventScroll: true }); });
$('#presentation-prev').addEventListener('click', () => presentationGo(presentationIndex - 1));
$('#presentation-next').addEventListener('click', () => presentationGo(presentationIndex + 1));
$('#presentation-close').addEventListener('click', closePresentation);
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || $('#image-dialog').open) return;
  if (event.key === 'Escape') { if (presentationActive) closePresentation(); if (!$('#mobile-menu').hidden) { closeMenu(); $('#menu-toggle').focus(); } }
  if (!presentationActive || $('#image-dialog').open || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.id === 'structure-canvas') return;
  if (event.key === 'ArrowRight') { event.preventDefault(); presentationGo(presentationIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); presentationGo(presentationIndex - 1); }
});

let scrollQueued = false;
function onScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    $('.reading-progress span').style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    if (presentationActive) {
      let nearest = 0;
      let distance = Infinity;
      chapters.forEach((chapter, index) => { const top = Math.abs(chapter.getBoundingClientRect().top - 80); if (top < distance) { nearest = index; distance = top; } });
      presentationIndex = nearest;
      updatePresentationPosition();
    }
    scrollQueued = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });

updateLanguage(language);
onScroll();
$('#structure-canvas').tabIndex = 0;
import('./model-stage.js').then(({ initModelStage }) => { modelStage = initModelStage(); renderMotion(); }).catch(error => { console.error('Unable to initialize the illustrative model', error); });

// Trusted static translations. A separate opt-in-free visit counter requests an external aggregate counter; no cookies are set by this module.
