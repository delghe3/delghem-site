/* Copy payment details. Sending a payment always takes place at PayPal. */
(() => {
  'use strict';
  const button = document.querySelector('.copy-paypal');
  const status = document.getElementById('paypal-copy-status');
  if (!button || !status) return;
  button.addEventListener('click', async () => {
    const email = button.dataset.email;
    if (email !== 'ildelghe3@gmail.com') return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(email);
      status.textContent = button.dataset.copyDone || 'Copied';
    } catch (_) {
      status.textContent = button.dataset.copyError || 'Select and copy the displayed email';
    }
  });
})();
