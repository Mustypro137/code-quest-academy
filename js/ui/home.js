import { esc } from './html.js';
import { renderBackup } from './backup.js';
import { doneCount, isDone, getStats } from '../store.js';

// The first lesson, in module order, that is not done yet.
function nextLesson(modules) {
  for (const m of modules) {
    const lesson = m.lessons.find((l) => !isDone(m.id, l.id));
    if (lesson) return { module: m, lesson };
  }
  return null;
}

// refresh redraws the page after progress is restored from a backup.
export function renderHome(root, modules, refresh) {
  const cards = modules.map((m) => {
    const ready = m.lessons.length > 0;
    const tag = ready ? `${doneCount(m.id)} / ${m.lessons.length} done` : 'Coming soon';
    return `
    <li>
      <a class="module-card" href="#/module/${esc(m.id)}">
        <span class="icon" aria-hidden="true">${esc(m.icon)}</span>
        <h2>${esc(m.title)}</h2>
        <p>${esc(m.blurb)}</p>
        <span class="tag ${ready ? '' : 'tag-soon'}">${tag}</span>
      </a>
    </li>`;
  }).join('');

  const { xp, streak, lessonsDone } = getStats();
  const next = nextLesson(modules);
  const resume = next ? `
      <p><a class="btn btn-link" href="#/lesson/${esc(next.module.id)}/${esc(next.lesson.id)}">
        ${lessonsDone ? 'Continue' : 'Start'}: ${esc(next.lesson.title)} →
      </a></p>` : '';

  root.innerHTML = `
    <section class="hero">
      <h1>Welcome back, learner 👋</h1>
      <p>Small steps. Real code. Pick a module to begin your quest.</p>
      <p class="stats">
        <span>🔥 ${streak} day streak</span>
        <span>⭐ ${xp} XP</span>
        <span>✅ ${lessonsDone} lesson${lessonsDone === 1 ? '' : 's'} done</span>
      </p>${resume}
    </section>
    <ul class="module-grid">${cards}</ul>`;
  renderBackup(root, refresh);
  document.title = 'CodeQuest Academy';
}

const LEVELS = [
  ['beginner', 'Beginner'],
  ['intermediate', 'Intermediate'],
  ['advanced', 'Advanced'],
];

function lessonList(m, lessons) {
  const items = lessons.map((l, i) => `
    <li><a class="lesson-link" href="#/lesson/${esc(m.id)}/${esc(l.id)}">
      <span class="lesson-num">${i + 1}</span> ${esc(l.title)}
      ${isDone(m.id, l.id) ? '<span class="done-mark">✓ Done</span>' : ''}
    </a></li>`).join('');
  return `<ol class="lesson-list">${items}</ol>`;
}

// Lessons are grouped by level. A module whose lessons have no level is one plain list.
function lessonGroups(m) {
  if (m.lessons.every((l) => !l.level)) return lessonList(m, m.lessons);
  return LEVELS.map(([level, label]) => {
    const lessons = m.lessons.filter((l) => (l.level ?? 'beginner') === level);
    return lessons.length ? `<h2>${label}</h2>${lessonList(m, lessons)}` : '';
  }).join('');
}

export function renderModule(root, m) {
  root.innerHTML = `
    <p><a href="#/">← All modules</a></p>
    <h1>${esc(m.icon)} ${esc(m.title)}</h1>
    <p>${esc(m.blurb)}</p>
    ${m.lessons.length ? lessonGroups(m) : '<p>Lessons for this module are coming soon.</p>'}`;
  document.title = `${m.title} · CodeQuest Academy`;
}

export function renderMessage(root, title, text) {
  root.innerHTML = `
    <h1>${esc(title)}</h1>
    <p>${esc(text)}</p>
    <p><a href="#/">Go back home</a></p>`;
  document.title = `${title} · CodeQuest Academy`;
}
