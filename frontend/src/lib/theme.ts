'use client';

/**
 * Shared theme management utilities for FINROQ.
 * Centralises localStorage persistence, DOM attribute setting,
 * and initial theme detection so every toggle in the app behaves identically.
 */

const STORAGE_KEY = 'finroq_theme';

/** Read the persisted theme, falling back to system preference then 'light'. */
export function getStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  // Fall back to OS preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

/** Apply theme to the DOM <html> element and persist to localStorage. */
export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}
