// js/access.js
// Access-quick page: chip selection, Turnstile, form submission via MC API

(function () {
  const form = document.getElementById('access-form');
  const successEl = document.getElementById('access-success');
  const errorEl = document.getElementById('access-error');
  const submitBtn = document.getElementById('access-submit');
  const chipsContainer = document.getElementById('access-chips');

  if (!form || !chipsContainer) return;

  const API_ENDPOINT = 'https://api.mergecombinator.com/access/provision';
  const selectedInterests = new Set();

  // ── Chip toggle ───────────────────────────────
  chipsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.access-chip');
    if (!chip) return;

    const value = chip.dataset.value;
    if (selectedInterests.has(value)) {
      selectedInterests.delete(value);
      chip.classList.remove('access-chip--active');
    } else {
      selectedInterests.add(value);
      chip.classList.add('access-chip--active');
    }
  });

  // ── Turnstile ─────────────────────────────────
  let turnstileToken = null;
  const turnstileSiteKey = document.body.dataset.turnstileSiteKey || '';
  const isLightTheme = document.documentElement.classList.contains('light-theme');

  window.onTurnstileSuccess = function (token) {
    turnstileToken = token;
  };

  window.onTurnstileError = function () {
    turnstileToken = null;
  };

  window.onloadTurnstileCallback = function () {
    const container = document.getElementById('turnstile-container');
    if (container && turnstileSiteKey && window.turnstile) {
      window.turnstile.render(container, {
        sitekey: turnstileSiteKey,
        theme: isLightTheme ? 'light' : 'dark',
        callback: window.onTurnstileSuccess,
        'error-callback': window.onTurnstileError,
      });
    }
  };

  // ── Form submission ───────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedInterests.size === 0) {
      highlightChips();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting\u2026';

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      areas: Array.from(selectedInterests),
      'cf-turnstile-response': turnstileToken || '',
      source: window.location.href,
    };

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 409) {
        // 409 = EMAIL_EXISTS, still a success for quick access
        form.style.display = 'none';
        successEl.style.display = 'flex';
      } else {
        throw new Error('Request failed');
      }
    } catch (err) {
      form.style.display = 'none';
      errorEl.style.display = 'flex';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get Access';
    }
  });

  function highlightChips() {
    chipsContainer.style.outline = '1px solid rgba(248, 113, 113, 0.5)';
    chipsContainer.style.outlineOffset = '4px';
    chipsContainer.style.borderRadius = '8px';
    setTimeout(() => {
      chipsContainer.style.outline = '';
      chipsContainer.style.outlineOffset = '';
      chipsContainer.style.borderRadius = '';
    }, 2000);
  }
})();
