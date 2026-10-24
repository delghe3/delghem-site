/* Optional convenience: copy the publicly disclosed project PayPal email. */
(() => {
  'use strict';
  const button = document.querySelector('.copy-paypal');
  if (!button) return;
  button.addEventListener('click', async () => {
    const email = button.dataset.email;
    if (email !== 'ildelghe3@gmail.com') return;
    try {
      await navigator.clipboard.writeText(email);
      const initial = button.textContent;
      button.textContent = button.dataset.copyDone || 'Copied';
      setTimeout(() => { button.textContent = initial; }, 2200);
    } catch (_) {
      button.focus();
      button.title = email;
    }
  });
})();
