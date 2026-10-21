import { exportProgress, importProgress, getStats } from '../store.js';
import { esc } from './html.js';

// Backup box for the home page. onImport runs after a successful import.
export function renderBackup(root, onImport) {
  const { lastExport } = getStats();
  root.insertAdjacentHTML('beforeend', `
    <section class="backup">
      <h2>Backup your progress</h2>
      <p>Your progress lives in this browser only. Save a backup file now and then.
        Last backup: <strong>${lastExport ? esc(lastExport) : 'never'}</strong></p>
      <div class="backup-actions">
        <button class="btn" type="button" id="export-btn">Download backup</button>
        <label class="btn btn-ghost">Restore from file
          <input type="file" id="import-input" accept="application/json,.json" hidden>
        </label>
      </div>
      <p id="backup-status" role="status"></p>
    </section>`);

  const status = root.querySelector('#backup-status');

  root.querySelector('#export-btn').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codequest-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = 'Backup downloaded.';
  });

  root.querySelector('#import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      importProgress(await file.text());
      onImport();
    } catch (err) {
      status.textContent = err.message;
    }
  });
}
