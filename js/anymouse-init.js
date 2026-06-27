// js/anymouse-init.js
// Mounts the Anymouse quick-capture widget on mc_site.
//
// Anymouse is a reusable widget vendored from the SigmaBlox monorepo
// (packages/anymouse). The bundle at js/lib/anymouse.js is an IIFE that sets
// window.Anymouse; importing it here runs that side effect. To refresh the
// widget, rebuild packages/anymouse and re-copy dist/anymouse.js into js/lib/.
//
// mc_site wiring:
//   - getUser():  reuse the site's VIA/Authentik session via builders/auth.js
//   - save(note): POST to the shared webhook's /api/member/notes, mirroring the
//                 auth of builders/api.js (credentials:'include' to the same
//                 apiBase) but WITHOUT its auto-redirect-on-401 — a logged-out
//                 capture should surface Anymouse's own sign-in prompt, not
//                 bounce the user off the page mid-note.

import './lib/anymouse.js';
import '../styles/anymouse-mc.css';
import { checkAuth } from './builders/auth.js';

// Resolve the API base the same way builders/api.js does, so notes save to the
// exact endpoint MC's other private features already use.
function getApiBase() {
  if (window.MCBuildersConfig && window.MCBuildersConfig.apiBase) {
    return window.MCBuildersConfig.apiBase;
  }
  return 'https://api.sigmablox.com';
}

// Human-readable note title per category (matches Anymouse's built-in categories).
const CATEGORY_TITLES = {
  observation: 'Observation',
  blocker: 'Blocker',
  idea: 'New Idea',
  note: 'Quick Note',
};

async function saveNote(note) {
  const response = await fetch(`${getApiBase()}/api/member/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      action: 'add',
      // The backend keys notes to a target; quick-capture has no specific
      // company/coach, so we use the same sentinel the SigmaBlox integration
      // uses. It resolves to a null FK server-side (tolerated) and keeps the
      // note attached to the member via the authenticated session.
      targetType: 'company',
      targetId: 'quick-note',
      content: note.content,
      title: CATEGORY_TITLES[note.category] || 'Quick Note',
      tags: note.tags,
      pinned: false,
    }),
  });

  if (!response.ok) {
    let message = 'Failed to save note';
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new Error(message);
  }

  return response.json();
}

async function getUser() {
  const { user } = await checkAuth();
  return user && user.email ? { email: user.email } : null;
}

function start() {
  if (!window.Anymouse || typeof window.Anymouse.init !== 'function') return;

  window.Anymouse.init({
    getUser,
    save: saveNote,
    // The widget mounts for everyone; Save prompts sign-in when logged out.
    signInUrl: '/access',
    // mc_site has no member notes page yet — hide "View all" until it exists.
    viewAllUrl: null,
    // Anchor below the shared navbar (each page renders #mc-navbar).
    anchor: { selector: '#mc-navbar', gap: 24 },
    captureContext: false,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
