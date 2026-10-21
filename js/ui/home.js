import { esc } from './html.js';
import { lessonStates } from '../path.js';

const LEVELS = [
  ['beginner', 'Beginner'],
  ['intermediate', 'Intermediate'],
  ['advanced', 'Advanced'],
];

const MARK = { done: '<span class="done-mark">✓ Done</span>', locked: '<span class="done-mark">🔒 Locked</span>' };

// states[i] is the state of m.lessons[i] (see path.js).
function lessonList(m, lessons, states) {
  const items = lessons.map((l, i) => `
    <li><a class="lesson-link" href="#/lesson/${esc(m.id)}/${esc(l.id)}">
      <span class="lesson-num">${i + 1}</span> ${esc(l.title)}
      ${MARK[states[m.lessons.indexOf(l)]] ?? ''}
    </a></li>`).join('');
  return `<ol class="lesson-list">${items}</ol>`;
}

// Lessons are grouped by level. A module whose lessons have no level is one plain list.
function lessonGroups(m) {
  const states = lessonStates(m);
  if (m.lessons.every((l) => !l.level)) return lessonList(m, m.lessons, states);
  return LEVELS.map(([level, label]) => {
    const lessons = m.lessons.filter((l) => (l.level ?? 'beginner') === level);
    return lessons.length ? `<h2>${label}</h2>${lessonList(m, lessons, states)}` : '';
  }).join('');
}

export function renderModule(root, m) {
  root.innerHTML = `
    <p><a href="#/roadmap">← Roadmap</a></p>
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
