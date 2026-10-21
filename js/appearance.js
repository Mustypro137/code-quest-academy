import { getTheme, getSettings } from './store.js';

// Puts the saved theme and the motion setting on the page. Call again after either changes.
// Dark is the default. "system" follows the device.
export function effectiveTheme() {
  const saved = getTheme() ?? 'dark';
  if (saved !== 'system') return saved;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyAppearance() {
  const root = document.documentElement;
  root.dataset.theme = effectiveTheme();
  root.dataset.motion = getSettings().reduceMotion ? 'reduce' : 'full';
}

matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (getTheme() === 'system') applyAppearance();
});
