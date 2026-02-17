// js/theme.js — Global theme system (light/dark)
// Manages localStorage persistence and prefers-color-scheme detection.
// The inline FOUC-prevention script in <head> applies the class before paint.
// This module provides the toggle API consumed by navbar.js.

const STORAGE_KEY = 'mc-theme';

function getSystemPreference() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function getTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemPreference();
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('light-theme', theme === 'light');
  document.body.classList.toggle('light-theme', theme === 'light');
}

function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  // Dispatch event for navbar toggle sync
  window.dispatchEvent(new CustomEvent('mc-theme-change', { detail: { theme } }));
}

function toggleTheme() {
  const current = getTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// Listen for system preference changes (only if no explicit user choice)
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });
}

// Apply on load (backup — the inline script in <head> handles the initial application)
applyTheme(getTheme());

// Export for navbar.js
export { getTheme, setTheme, toggleTheme };
