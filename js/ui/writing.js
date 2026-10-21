import { esc } from './html.js';
import { getChecks, setCheck, getDraft, setDraft } from '../store.js';
import { backLink } from './practice.js';

// LinkedIn practice room: write a draft, check it against a short list, copy it when it is ready.
// Drafts stay on this device and save as you type.
export function renderWriting(root, drafts) {
  root.innerHTML = `
    ${backLink()}
    <h1>LinkedIn practice room</h1>
    <p class="muted">Write your drafts here, then copy them to LinkedIn or GitHub when you are happy. Drafts stay on this device.
      Use only true details, and never put private or customer data in a draft.</p>
    <fieldset class="segmented"><legend>Draft</legend>
      <div class="seg-group">${drafts.map((d, i) => `
        <label class="seg"><input type="radio" name="draft" value="${esc(d.id)}"${i === 0 ? ' checked' : ''}><span>${esc(d.title)}</span></label>`).join('')}
      </div>
    </fieldset>
    <section class="card" id="panel" aria-live="off"></section>`;
  document.title = 'LinkedIn practice room · CodeQuest Academy';

  const panel = root.querySelector('#panel');
  let saveNow = () => {};

  function show(id) {
    saveNow(); // do not lose the draft you were typing
    const d = drafts.find((x) => x.id === id);
    const checks = getChecks();
    panel.innerHTML = `
      <h2>${esc(d.title)}</h2>
      <p>${esc(d.help)}</p>
      <label class="sr-only" for="draft-text">${esc(d.title)} draft</label>
      <textarea id="draft-text" class="code editor draft" rows="12" spellcheck="true"></textarea>
      <p class="muted" id="counter"></p>
      <div class="codebox-bar">
        <button class="btn btn-ghost" type="button" id="insert-template">Insert the template</button>
        <button class="btn" type="button" id="copy-draft">Copy draft</button>
        <span class="copy-status" role="status"></span>
      </div>
      <h3>Check your draft</h3>
      <ul class="checklist">${d.checklist.map((c, i) => `
        <li><input type="checkbox" id="chk-${i}" data-key="${esc(d.id)}/${i}"${`${d.id}/${i}` in checks ? ' checked' : ''}>
          <label for="chk-${i}">${esc(c)}</label></li>`).join('')}
      </ul>`;
    const text = panel.querySelector('#draft-text');
    const counter = panel.querySelector('#counter');
    const insert = panel.querySelector('#insert-template');
    const status = panel.querySelector('.copy-status');
    text.value = getDraft(d.id);

    const refresh = () => {
      const words = text.value.trim() ? text.value.trim().split(/\s+/).length : 0;
      counter.textContent = `${text.value.length} characters · ${words} word${words === 1 ? '' : 's'}`;
      insert.hidden = text.value.trim() !== '';
    };
    let timer;
    // The unchanged template is not saved: only your own words count as a draft.
    saveNow = () => { clearTimeout(timer); if (text.value !== d.template) setDraft(d.id, text.value); };
    text.addEventListener('input', () => { refresh(); clearTimeout(timer); timer = setTimeout(saveNow, 300); });
    text.addEventListener('blur', () => saveNow());
    insert.addEventListener('click', () => { text.value = d.template; refresh(); text.focus(); });
    panel.querySelector('#copy-draft').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text.value);
        status.textContent = 'Copied!';
      } catch {
        status.textContent = 'Could not copy. Select the text and press Ctrl+C.';
      }
    });
    panel.querySelectorAll('input[data-key]').forEach((box) => box.addEventListener('change', () => setCheck(box.dataset.key, box.checked)));
    refresh();
  }

  root.querySelectorAll('input[name="draft"]').forEach((radio) => radio.addEventListener('change', () => show(radio.value)));
  show(drafts[0].id);
}
