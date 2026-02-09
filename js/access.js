// js/access.js
// Request Access drawer wiring and submission handling

const drawer = document.getElementById('request-drawer');
const openBtn = document.getElementById('open-request-drawer');
const closeBtn = document.getElementById('close-drawer');
const backdrop = document.getElementById('drawer-backdrop');
const signInLink = document.getElementById('drawer-sign-in');
const form = document.getElementById('request-form');
const successEl = document.getElementById('request-success');
const errorEl = document.getElementById('request-error');
const errorLink = document.getElementById('request-error-link');
const config = window.MCAccessConfig || {};
const turnstileWidget = document.querySelector('.cf-turnstile');
const turnstileSiteKey = turnstileWidget
  ? turnstileWidget.getAttribute('data-sitekey') || ''
  : '';
const turnstileDebug = {
  hasWidget: !!turnstileWidget,
  hasSiteKey: !!turnstileSiteKey,
  host: window.location.hostname
};

// Guard for partial renders
if (!drawer || !openBtn || !closeBtn || !backdrop || !signInLink || !form || !successEl || !errorEl) {
  console.warn('[Access] Drawer elements missing; skipping drawer wiring.');
} else {
  function openDrawer(e) {
    e.preventDefault();
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function resetDrawerState() {
    form.reset();
    form.style.display = '';
    successEl.style.display = 'none';
    errorEl.style.display = 'none';
    if (errorLink) errorLink.style.display = 'none';
  }

  function closeDrawer(e) {
    if (e) e.preventDefault();
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(resetDrawerState, 300);
  }

  function buildMailtoUrl(data) {
    const to = config.notifyEmail || 'access@mergecombinator.com';
    const subject = encodeURIComponent('Access Request — mergecombinator.com');
    const body = encodeURIComponent(
      [
        'Access request submitted:',
        `Role: ${data.role || ''}`,
        `Organization: ${data.org || ''}`,
        `Email: ${data.email || ''}`,
        `Why: ${data.why || ''}`,
        `Building: ${data.building || ''}`,
        `Source: ${window.location.href}`,
        `Timestamp: ${new Date().toISOString()}`
      ].join('\n')
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

async function submitToEndpoint(data) {
  const endpoint = config.requestEndpoint;
  if (!endpoint) {
    return { ok: false, skipped: true };
  }

  try {
      const payload = {
        email: data.email || '',
        role: data.role || 'general',
        organization: data.org || '',
        reason: data.why || '',
        building: data.building || '',
        turnstileToken: window.turnstileToken || '',
        turnstileMissing: !window.turnstileToken,
        userAgent: String(navigator.userAgent || ''),
        referrer: String(document.referrer || ''),
        requestedAt: new Date().toISOString(),
        source: window.location.href
      };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json().catch(() => null) : null;
      const text = !isJson ? await response.text().catch(() => '') : '';
      const message = (data && (data.error || data.message)) || text || 'Request failed';
      const code = data && (data.code || data.errorCode);
      return { ok: false, status: response.status, message, code };
    }

    return { ok: true };
  } catch (error) {
    console.error('[Access] Endpoint submission failed:', error);
    return { ok: false, error };
  }
}

  async function handleSubmit(e) {
    e.preventDefault();
    errorEl.style.display = 'none';

    const formData = new FormData(form);
    const data = {
      role: String(formData.get('role') || ''),
      org: String(formData.get('org') || ''),
      email: String(formData.get('email') || ''),
      why: String(formData.get('why') || ''),
      building: String(formData.get('building') || '')
    };

    if (!turnstileDebug.hasWidget || !turnstileDebug.hasSiteKey) {
      const textEl = errorEl.querySelector('.request-drawer__error-text');
      if (textEl) {
        textEl.textContent = 'Turnstile is not configured for this host. We will still submit this request.';
      }
      errorEl.style.display = 'block';
    } else if (!window.turnstileToken) {
      const textEl = errorEl.querySelector('.request-drawer__error-text');
      if (textEl) {
        textEl.textContent = 'Couldn’t verify Turnstile. We will still submit this request.';
      }
      errorEl.style.display = 'block';
    }

    const result = await submitToEndpoint(data);

  if (!result.ok) {
    if (config.allowMailtoFallback) {
      try {
        const mailtoUrl = buildMailtoUrl(data);
        window.location.href = mailtoUrl;
      } catch (error) {
        console.error('[Access] Mailto fallback failed:', error);
        errorEl.style.display = 'block';
        return;
      }
    }

    errorEl.style.display = 'block';
    if (result.message) {
      const textEl = errorEl.querySelector('.request-drawer__error-text');
      if (textEl) {
        textEl.textContent = result.message;
      }
    }
    if (!result.message) {
      const textEl = errorEl.querySelector('.request-drawer__error-text');
      if (textEl) {
        textEl.textContent = 'Couldn’t verify or submit. Please try again or email access@mergecombinator.com.';
      }
    }
    return;
  }

  form.style.display = 'none';
  successEl.style.display = 'block';
}

  openBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  signInLink.addEventListener('click', closeDrawer);
  form.addEventListener('submit', handleSubmit);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });
}
