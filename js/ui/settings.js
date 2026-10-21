import { esc } from './html.js';
import { renderBackup } from './backup.js';
import { getTheme, setTheme, getSettings, setSetting, resetProgress } from '../store.js';
import { applyAppearance } from '../appearance.js';
import { updateChip } from './rewards.js';

const THEMES = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']];

function themeChoices() {
  const current = getTheme() ?? 'dark';
  return THEMES.map(([value, label]) => `
    <label class="seg"><input type="radio" name="theme" value="${value}"${value === current ? ' checked' : ''}><span>${label}</span></label>`).join('');
}

function switchRow(id, checked, title, help) {
  return `
    <div class="switch-row">
      <input type="checkbox" id="${id}" class="switch"${checked ? ' checked' : ''}>
      <label for="${id}"><strong>${esc(title)}</strong><span class="muted">${esc(help)}</span></label>
    </div>`;
}

// What the service worker has saved, so you know if the site will open without internet.
async function offlineStatus(box) {
  const rows = [];
  if (!('serviceWorker' in navigator)) {
    box.innerHTML = '<p>This browser cannot save the site for offline use.</p>';
    return;
  }
  let files = 0;
  try {
    for (const name of await caches.keys()) files += (await (await caches.open(name)).keys()).length;
  } catch { /* the cache is not available, for example in a private window */ }
  const ready = Boolean(navigator.serviceWorker.controller) && files > 0;
  rows.push(['Offline mode', ready ? '✅ Ready. The site opens without internet.' : '⏳ Not ready yet. Open the site once while you are online.']);
  rows.push(['Saved files', String(files)]);
  const estimate = await navigator.storage?.estimate?.().catch(() => null);
  if (estimate?.usage) rows.push(['Space used', `${(estimate.usage / 1048576).toFixed(1)} MB`]);
  rows.push(['Connection', navigator.onLine ? 'Online' : 'Offline']);
  box.innerHTML = `<dl class="facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

// refresh redraws the page after a restore or a reset.
export function renderSettings(root, refresh) {
  const settings = getSettings();
  root.innerHTML = `
    <div class="settings">
    <h1>Settings</h1>
    <section class="card" aria-labelledby="look-h">
      <h2 id="look-h">Appearance</h2>
      <fieldset class="segmented"><legend>Theme</legend><div class="seg-group">${themeChoices()}</div></fieldset>
      ${switchRow('reduce-motion', settings.reduceMotion, 'Reduce motion', 'Turns off animations and transitions.')}
    </section>
    <section class="card" aria-labelledby="learn-h">
      <h2 id="learn-h">Learning</h2>
      ${switchRow('unlock-all', settings.unlockAll, 'Unlock everything', 'Shows every lesson as available on the roadmap. Locks are only a suggestion, so you can always open a lesson anyway.')}
    </section>
    <section class="card" aria-labelledby="off-h">
      <h2 id="off-h">Offline status</h2>
      <div id="offline-box" role="status"><p class="muted">Checking…</p></div>
    </section>
    <div id="backup-slot"></div>
    <section class="card danger-zone" aria-labelledby="reset-h">
      <h2 id="reset-h">Reset progress</h2>
      <p>Erase your XP, streak, solved exercises and quiz scores on this device. This cannot be undone, so download a backup first.</p>
      <button class="btn btn-danger" type="button" id="reset-btn">Reset my progress…</button>
      <p id="reset-status" role="status"></p>
    </section>
    <dialog id="reset-dialog" aria-labelledby="reset-title">
      <h2 id="reset-title">Reset all progress?</h2>
      <p>Your XP, streak, achievements and scores will be erased from this device.</p>
      <div class="dialog-actions">
        <button class="btn btn-ghost" type="button" id="reset-cancel" autofocus>Cancel</button>
        <button class="btn btn-danger" type="button" id="reset-confirm">Yes, reset</button>
      </div>
    </dialog>
    </div>`;
  renderBackup(root.querySelector('#backup-slot'), refresh);

  root.querySelectorAll('input[name="theme"]').forEach((input) => input.addEventListener('change', () => {
    setTheme(input.value);
    applyAppearance();
  }));
  root.querySelector('#reduce-motion').addEventListener('change', (e) => {
    setSetting('reduceMotion', e.target.checked);
    applyAppearance();
  });
  root.querySelector('#unlock-all').addEventListener('change', (e) => setSetting('unlockAll', e.target.checked));

  const dialog = root.querySelector('#reset-dialog');
  root.querySelector('#reset-btn').addEventListener('click', () => dialog.showModal());
  root.querySelector('#reset-cancel').addEventListener('click', () => dialog.close());
  root.querySelector('#reset-confirm').addEventListener('click', () => {
    dialog.close();
    resetProgress();
    updateChip();
    renderSettings(root, refresh);
    root.querySelector('#reset-status').textContent = 'Your progress was reset.';
  });

  offlineStatus(root.querySelector('#offline-box'));
  document.title = 'Settings · CodeQuest Academy';
}
