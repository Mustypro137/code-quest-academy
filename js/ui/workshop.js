import { esc, bar } from './html.js';
import { getChecks, setCheck, getDraft, setDraft } from '../store.js';
import { backLink } from './practice.js';

// Project workshop: tick off the steps of the two projects, and plan a project of your own.
// No XP here: projects are for your portfolio.
export function renderWorkshop(root, workshop) {
  const checks = getChecks();

  const projectCard = (p) => {
    const done = p.steps.filter((_, i) => `${p.id}/${i}` in checks).length;
    return `
      <section class="card project" data-project="${esc(p.id)}" aria-labelledby="p-${esc(p.id)}">
        <h2 id="p-${esc(p.id)}">${esc(p.title)}</h2>
        <p>${esc(p.summary)}</p>
        <div class="project-bar">${bar((done / p.steps.length) * 100, `${p.title} progress`)}<span class="muted" data-count>${done} of ${p.steps.length} steps</span></div>
        <ul class="checklist">${p.steps.map((s, i) => `
          <li>
            <input type="checkbox" id="${esc(p.id)}-${i}" data-key="${esc(p.id)}/${i}"${`${p.id}/${i}` in checks ? ' checked' : ''}>
            <label for="${esc(p.id)}-${i}"><strong>${esc(s.title)}</strong> <span class="muted">${esc(s.text)}</span></label>
            <a href="${esc(s.href)}" class="step-link">Open lesson<span class="sr-only"> for ${esc(s.title)}</span> →</a>
          </li>`).join('')}
        </ul>
      </section>`;
  };

  const plan = workshop.plan;
  root.innerHTML = `
    ${backLink()}
    <h1>Project workshop</h1>
    <p class="muted">Tick each step when you finish it. Use fake data only. This room gives no XP: the reward is a project you can show.</p>
    ${workshop.projects.map(projectCard).join('')}
    <section class="card" aria-labelledby="plan-h">
      <h2 id="plan-h">${esc(plan.title)}</h2>
      <p>${esc(plan.help)}</p>
      <label class="sr-only" for="plan-text">${esc(plan.title)}</label>
      <textarea id="plan-text" class="code editor draft" rows="14" spellcheck="true"></textarea>
      <div class="codebox-bar">
        <button class="btn btn-ghost" type="button" id="plan-template">Insert the template</button>
        <button class="btn btn-ghost" type="button" id="plan-copy">Copy</button>
        <span class="copy-status" role="status"></span>
      </div>
    </section>`;
  document.title = 'Project workshop · CodeQuest Academy';

  root.querySelectorAll('input[data-key]').forEach((box) => box.addEventListener('change', () => {
    setCheck(box.dataset.key, box.checked);
    const card = box.closest('.project');
    const all = [...card.querySelectorAll('input[data-key]')];
    const done = all.filter((b) => b.checked).length;
    card.querySelector('[role=progressbar]').setAttribute('aria-valuenow', Math.round((done / all.length) * 100));
    card.querySelector('[role=progressbar] > span').style.width = `${(done / all.length) * 100}%`;
    card.querySelector('[data-count]').textContent = `${done} of ${all.length} steps`;
  }));

  // The plan saves as you type.
  const text = root.querySelector('#plan-text');
  const templateBtn = root.querySelector('#plan-template');
  const status = root.querySelector('.copy-status');
  text.value = getDraft(plan.id);
  templateBtn.hidden = text.value.trim() !== '';
  let timer;
  const save = () => { clearTimeout(timer); setDraft(plan.id, text.value); };
  text.addEventListener('input', () => {
    templateBtn.hidden = text.value.trim() !== '';
    clearTimeout(timer);
    timer = setTimeout(save, 300);
  });
  text.addEventListener('blur', save);
  templateBtn.addEventListener('click', () => {
    text.value = plan.template;
    templateBtn.hidden = true;
    save();
    text.focus();
  });
  root.querySelector('#plan-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text.value);
      status.textContent = 'Copied!';
    } catch {
      status.textContent = 'Could not copy. Select the text and press Ctrl+C.';
    }
  });
}
