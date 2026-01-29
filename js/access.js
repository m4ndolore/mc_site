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
const config = window.MCAccessConfig || {};

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
        `Name: ${data.name || ''}`,
        `Email: ${data.email || ''}`,
        `Role: ${data.role || ''}`,
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
        email: data.email,
        name: data.name,
        tier: data.role || 'general',
        website_url: '',
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
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Endpoint returned ${response.status}: ${text}`);
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
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      role: String(formData.get('role') || '')
    };

    const result = await submitToEndpoint(data);

    if (!result.ok) {
      try {
        const mailtoUrl = buildMailtoUrl(data);
        window.location.href = mailtoUrl;
      } catch (error) {
        console.error('[Access] Mailto fallback failed:', error);
        errorEl.style.display = 'block';
        return;
      }
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

