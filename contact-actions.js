/* Business contact address copy: independent from the personal PayPal recipient. */
(() => {
  'use strict';
  const email = 'delghem@proton.me';
  const button = document.querySelector('.contact-copy-button');
  const status = document.getElementById('contact-copy-status');
  if (!button || !status) return;
  button.addEventListener('click', async () => {
    try {
      if (button.dataset.contactEmail !== email) throw new Error('Contact mismatch');
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const field=document.createElement('textarea');
        field.value=email;
        field.style.cssText='position:fixed;left:-9999px;top:-9999px';
        document.body.append(field);field.select();
        const copied=document.execCommand('copy');field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      status.textContent = document.documentElement.lang==='it'?'Indirizzo copiato':'Email copied';
    } catch (_) {
      status.textContent = document.documentElement.lang==='it'
        ? 'Seleziona e copia l’indirizzo mostrato.'
        : 'Select and copy the email address shown.';
    }
  });
})();
