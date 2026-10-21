import { esc, bar } from './html.js';
import { doneCount } from '../store.js';
import { lessonStates, nextLesson } from '../path.js';

const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const DOT = { done: '✓', current: '▶', available: '', locked: '🔒' };
const STATE_TEXT = { done: 'Done', current: 'Up next', available: 'Available', locked: 'Locked' };

function node(module, lesson, i, state) {
  const href = `#/lesson/${esc(module.id)}/${esc(lesson.id)}`;
  const dot = `<span class="dot" aria-hidden="true">${DOT[state] || i + 1}</span>`;
  const label = `<span class="node-title">${esc(lesson.title)}</span><span class="node-state">${STATE_TEXT[state]}</span>`;
  if (state !== 'locked') {
    return `<li class="node ${state}"><a class="node-link" href="${href}"${state === 'current' ? ' aria-current="step"' : ''}>${dot}${label}</a></li>`;
  }
  const previous = module.lessons[i - 1];
  const noteId = `lock-${esc(module.id)}-${i}`;
  return `
    <li class="node locked">
      <button class="node-link" type="button" aria-expanded="false" aria-controls="${noteId}">${dot}${label}</button>
      <p class="lock-note" id="${noteId}" hidden>
        Finish “${esc(previous.title)}” first, or turn on “Unlock everything” in Settings.
        <a href="${href}">Start anyway</a>
      </p>
    </li>`;
}

function moduleSection(module, open) {
  const states = lessonStates(module);
  const done = doneCount(module.id);
  const total = module.lessons.length;
  let lastLevel = null;
  const rows = module.lessons.map((lesson, i) => {
    const level = lesson.level && module.lessons.some((l) => l.level) ? lesson.level : null;
    const heading = level && level !== lastLevel ? `<li class="path-level" aria-hidden="true">${LEVELS[level] ?? esc(level)}</li>` : '';
    lastLevel = level ?? lastLevel;
    return heading + node(module, lesson, i, states[i]);
  }).join('');
  return `
    <details class="road card"${open ? ' open' : ''}>
      <summary>
        <span class="icon" aria-hidden="true">${esc(module.icon)}</span>
        <span class="road-title">${esc(module.title)}</span>
        <span class="road-count">${total ? `${done} / ${total}` : 'Coming soon'}</span>
        ${bar(total ? (done / total) * 100 : 0, `${module.title} progress`)}
      </summary>
      ${total ? `<ol class="path">${rows}</ol>` : `<p class="muted road-soon">${esc(module.blurb)} The lessons are coming soon.</p>`}
    </details>`;
}

// The Python path is shown in numbered stages. The other modules come after it.
function sections(modules, next) {
  const stages = [...new Set(modules.filter((m) => m.track).map((m) => m.stage))];
  let html = '';
  let last = null;
  for (const m of modules) {
    const group = m.track ? m.stage : 'more';
    if (group !== last) {
      last = group;
      html += m.track
        ? `<h2 class="stage">Stage ${stages.indexOf(m.stage) + 1}: ${esc(m.stageTitle)}</h2>`
        : '<h2 class="stage">More modules</h2>';
    }
    html += moduleSection(m, next ? m.id === next.module.id : false);
  }
  return html;
}

export function renderRoadmap(root, modules) {
  const next = nextLesson(modules);
  root.innerHTML = `
    <h1>Learning roadmap</h1>
    <p class="muted">Follow each path from top to bottom. <strong>✓</strong> done, <strong>▶</strong> up next, <strong>🔒</strong> locked until the lesson before it is done.
      Locks are only a suggestion: you can always start a locked lesson anyway.</p>
    ${sections(modules, next)}`;
  root.querySelectorAll('button.node-link').forEach((button) => {
    button.addEventListener('click', () => {
      const note = root.querySelector(`#${button.getAttribute('aria-controls')}`);
      note.hidden = !note.hidden;
      button.setAttribute('aria-expanded', String(!note.hidden));
    });
  });
  document.title = 'Roadmap · CodeQuest Academy';
}
