// js/contribute.js
// Contributor access request form handling

const config = window.MCContributeConfig || {};
const form = document.getElementById('contribute-form');
const authRequired = document.getElementById('auth-required');
const formError = document.getElementById('form-error');
const errorMessage = document.getElementById('error-message');
const formSuccess = document.getElementById('form-success');
const submitBtn = document.getElementById('submit-btn');

// Check auth state and show appropriate UI
async function checkAuthState() {
  try {
    const response = await fetch(config.authCheckEndpoint || '/auth/me', {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.authenticated && data.user) {
        // User is authenticated - show form
        authRequired.classList.remove('is-visible');
        form.style.display = 'flex';
        return data.user;
      }
    }

    // Not authenticated - show auth required
    authRequired.classList.add('is-visible');
    form.style.display = 'none';
    return null;
  } catch (error) {
    console.error('[Contribute] Auth check failed:', error);
    // On error, show auth required as fallback
    authRequired.classList.add('is-visible');
    form.style.display = 'none';
    return null;
  }
}

// Submit contributor request
async function submitRequest(data, user) {
  const endpoint = config.requestEndpoint;
  if (!endpoint) {
    console.warn('[Contribute] No request endpoint configured');
    return { ok: false, message: 'Service not configured' };
  }

  try {
    const payload = {
      email: user.email,
      name: user.name || user.email,
      expertise: data.expertise,
      reason: data.reason,
      sample: data.sample || '',
      requestType: 'docs-contributor',
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
      const errorData = isJson ? await response.json().catch(() => null) : null;
      const message = (errorData && (errorData.error || errorData.message)) || 'Request failed';
      return { ok: false, status: response.status, message };
    }

    return { ok: true };
  } catch (error) {
    console.error('[Contribute] Request submission failed:', error);
    return { ok: false, message: 'Network error. Please retry.' };
  }
}

// Handle form submission
async function handleSubmit(e, user) {
  e.preventDefault();

  // Hide previous error
  formError.classList.remove('is-visible');

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const formData = new FormData(form);
  const data = {
    expertise: formData.get('expertise'),
    reason: formData.get('reason'),
    sample: formData.get('sample') || ''
  };

  const result = await submitRequest(data, user);

  if (!result.ok) {
    // Show error
    errorMessage.textContent = result.message || 'Request failed. Please retry.';
    formError.classList.add('is-visible');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      Request Access
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    `;
    return;
  }

  // Show success
  form.style.display = 'none';
  formSuccess.classList.add('is-visible');
}

// Initialize on load
async function init() {
  const user = await checkAuthState();

  if (user && form) {
    form.addEventListener('submit', (e) => handleSubmit(e, user));
  }
}

init();
