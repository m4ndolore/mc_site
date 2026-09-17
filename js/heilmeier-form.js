// Heilmeier Catechism answer form.
//
// Lives in the right rail of /knowledge/heilmeier-catechism. Founders fill
// the eight answers in as they read; drafts save on this device; submit
// sends one email to the team and a copy to the founder via the API.

const API_ENDPOINT = 'https://api.mergecombinator.com/access/catechism';
const STORAGE_KEY = 'mc-heilmeier-answers';
const QUESTION_IDS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];
const CONTACT_FIELDS = ['name', 'email', 'organization'];

const form = document.getElementById('hcForm');

if (form) {
  const sidebar = form.closest('.hc-layout__sidebar');
  const status = form.querySelector('.hc-form__status');
  const submitBtn = form.querySelector('.hc-form__submit');
  const fields = {};
  [...QUESTION_IDS, ...CONTACT_FIELDS].forEach((name) => {
    fields[name] = form.elements[name];
  });

  // ── Draft persistence (this device only) ──────────────────────────────
  function readDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeDraft() {
    const draft = {};
    Object.entries(fields).forEach(([name, el]) => {
      if (el && el.value.trim()) draft[name] = el.value;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage unavailable (private mode, quota). Drafts just won't persist.
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // ── Textarea auto-grow ────────────────────────────────────────────────
  function autosize(el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  const draft = readDraft();
  Object.entries(fields).forEach(([name, el]) => {
    if (!el) return;
    if (draft[name]) el.value = draft[name];
    if (el.tagName === 'TEXTAREA') autosize(el);
    el.addEventListener('input', () => {
      if (el.tagName === 'TEXTAREA') autosize(el);
      writeDraft();
    });
  });

  // ── Follow the reader: highlight the field for the question in view ────
  const items = new Map();
  form.querySelectorAll('.hc-form__item').forEach((li) => items.set(li.dataset.q, li));

  function activate(qid) {
    items.forEach((li, id) => li.classList.toggle('is-active', id === qid));
    const li = items.get(qid);
    if (!li || !sidebar) return;
    const canStick = window.matchMedia('(min-width: 1025px)').matches;
    if (!canStick) return;
    const top = li.offsetTop - 24;
    sidebar.scrollTo({ top, behavior: 'smooth' });
  }

  const sections = document.querySelectorAll('.hc-q[data-q]');
  if (sections.length && 'IntersectionObserver' in window) {
    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activate(`q${entry.target.dataset.q}`);
      });
    }, { threshold: 0.3 });
    sections.forEach((s) => watcher.observe(s));
  }

  // ── "Go to the form" buttons ──────────────────────────────────────────
  function firstEmptyField() {
    return QUESTION_IDS.map((id) => fields[id]).find((el) => el && !el.value.trim()) || fields.q1;
  }

  document.querySelectorAll('[data-action="hc-goto-form"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = firstEmptyField();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => target && target.focus({ preventScroll: true }), 500);
    });
  });

  // ── Submit ────────────────────────────────────────────────────────────
  function setStatus(text, kind) {
    if (!status) return;
    status.textContent = text;
    status.dataset.kind = kind || '';
  }

  function answeredCount() {
    return QUESTION_IDS.filter((id) => fields[id] && fields[id].value.trim()).length;
  }

  function buildPayload() {
    const answers = {};
    QUESTION_IDS.forEach((id) => { answers[id] = fields[id] ? fields[id].value.trim() : ''; });
    return {
      name: fields.name ? fields.name.value.trim() : '',
      email: fields.email ? fields.email.value.trim() : '',
      organization: fields.organization ? fields.organization.value.trim() : '',
      answers,
      website: form.elements.website ? form.elements.website.value : '',
      source: window.location.href.split('#')[0],
    };
  }

  function answersAsText() {
    const labels = form.querySelectorAll('.hc-form__label-text');
    return QUESTION_IDS.map((id, i) => {
      const label = labels[i] ? labels[i].textContent.trim() : id;
      const a = fields[id] && fields[id].value.trim() ? fields[id].value.trim() : '(blank)';
      return `${String(i + 1).padStart(2, '0')}  ${label}\n${a}`;
    }).join('\n\n');
  }

  function offerCopy() {
    const existing = form.querySelector('.hc-form__copy');
    if (existing) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hc-form__copy';
    btn.textContent = 'Copy my answers instead';
    btn.addEventListener('click', () => {
      const text = answersAsText();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(
          () => setStatus('Copied. Paste them into an email to build@mergecombinator.com.', 'ok'),
          () => setStatus('Could not copy. Select the answers above and copy them by hand.', 'error'),
        );
      }
    });
    status.insertAdjacentElement('afterend', btn);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = fields.email ? fields.email.value.trim() : '';
    if (answeredCount() === 0) {
      setStatus('Write at least one answer first. A blank form tells us nothing.', 'error');
      (fields.q1 || form).focus();
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('Add the email address you want the copy sent to.', 'error');
      fields.email && fields.email.focus();
      return;
    }

    submitBtn.disabled = true;
    const label = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    setStatus('', '');

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const body = await res.json().catch(() => ({}));
      const copySent = body && body.data && body.data.copySent !== false;
      form.classList.add('is-sent');
      submitBtn.textContent = 'Sent';
      setStatus(
        copySent
          ? `Sent. A copy is on its way to ${email}. We will read it and reply if we think we can help.`
          : 'Sent to Merge Combinator. The copy to you did not go through, so keep these answers here for now.',
        'ok',
      );
      clearDraft();
      if (window.plausible) window.plausible('Heilmeier Submit', { props: { answered: answeredCount() } });
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = label;
      setStatus('Could not send. Your answers are still saved on this device. Try again in a minute.', 'error');
      offerCopy();
    }
  });
}
