import { esc, bar } from './html.js';
import { doneCount, getStats, levelInfo } from '../store.js';
import { lessonStates, nextLesson } from '../path.js';
import { evaluateAchievements } from '../achievements.js';

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// A circle that fills as you get closer to the next level.
function levelRing(info) {
  const offset = RING_LENGTH * (1 - info.percent / 100);
  return `
    <svg class="ring" viewBox="0 0 120 120" role="img" aria-label="Level ${info.level}, ${info.percent} percent of the way to level ${info.level + 1}">
      <defs><linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/>
      </linearGradient></defs>
      <circle cx="60" cy="60" r="${RING_RADIUS}" class="ring-track"/>
      <circle cx="60" cy="60" r="${RING_RADIUS}" class="ring-fill" stroke="url(#ring-gradient)"
        stroke-dasharray="${RING_LENGTH.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 60 60)"/>
      <text x="60" y="56" text-anchor="middle" class="ring-level">${info.level}</text>
      <text x="60" y="76" text-anchor="middle" class="ring-label">LEVEL</text>
    </svg>`;
}

function continueCard(next, lessonsDone) {
  if (!next) {
    return `
      <section class="card hero-card">
        <p class="eyebrow">All done</p>
        <h2>You finished every lesson 🎉</h2>
        <p>Review any lesson from the roadmap, or build a new project.</p>
        <a class="btn btn-link" href="#/roadmap">Open the roadmap</a>
      </section>`;
  }
  return `
    <section class="card hero-card">
      <p class="eyebrow">${lessonsDone ? 'Continue where you stopped' : 'Start here'}</p>
      <h2><span aria-hidden="true">${esc(next.module.icon)}</span> ${esc(next.lesson.title)}</h2>
      <p>${esc(next.module.title)} · lesson ${next.index + 1} of ${next.module.lessons.length}</p>
      <a class="btn btn-link" href="#/lesson/${esc(next.module.id)}/${esc(next.lesson.id)}">${lessonsDone ? 'Continue' : 'Start'} lesson →</a>
    </section>`;
}

const STATE_TEXT = { done: '✓ Done', current: 'Up next', available: 'Available', locked: '🔒 Locked' };

function upNext(next) {
  if (!next) return '';
  const states = lessonStates(next.module);
  const rows = next.module.lessons.slice(next.index, next.index + 3).map((l, k) => `
    <li><a class="lesson-link" href="#/lesson/${esc(next.module.id)}/${esc(l.id)}">
      <span class="lesson-num">${next.index + k + 1}</span> ${esc(l.title)}
      <span class="done-mark">${STATE_TEXT[states[next.index + k]]}</span>
    </a></li>`).join('');
  return `
    <section aria-labelledby="up-next">
      <h2 id="up-next">Up next in ${esc(next.module.title)}</h2>
      <ol class="lesson-list">${rows}</ol>
    </section>`;
}

// The Python path has many modules, so it is one card. The roadmap shows its parts.
function groupModules(modules) {
  const path = modules.filter((m) => m.track);
  if (!path.length) return modules;
  const lessons = path.flatMap((m) => m.lessons.map((l) => ({ id: m.id + '/' + l.id })));
  const card = {
    id: 'python-path', icon: '🐍', title: 'Python path', href: '#/roadmap',
    blurb: `${path.length} modules from your first program to capstone projects.`,
    lessons, done: path.reduce((n, m) => n + doneCount(m.id), 0),
  };
  return [card, ...modules.filter((m) => !m.track)];
}

function moduleCards(modules) {
  return groupModules(modules).map((m) => {
    const total = m.lessons.length;
    const done = m.done ?? doneCount(m.id);
    return `
    <li>
      <a class="module-card" href="${esc(m.href ?? `#/module/${m.id}`)}">
        <span class="icon" aria-hidden="true">${esc(m.icon)}</span>
        <h3>${esc(m.title)}</h3>
        <p>${esc(m.blurb)}</p>
        ${total ? `${bar((done / total) * 100, `${m.title} progress`)}<span class="tag">${done} / ${total} done</span>` : '<span class="tag tag-soon">Coming soon</span>'}
      </a>
    </li>`;
  }).join('');
}

function achievementsCard(modules) {
  const all = evaluateAchievements(modules);
  const latest = all.filter((a) => a.unlocked).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 3);
  const upcoming = all.find((a) => !a.unlocked);
  const items = latest.map((a) => `<li><span aria-hidden="true">${esc(a.icon)}</span> <strong>${esc(a.title)}</strong></li>`).join('');
  return `
    <section class="card" aria-labelledby="ach-h">
      <h2 id="ach-h">Achievements</h2>
      ${items ? `<ul class="plain-list">${items}</ul>` : '<p>Finish a lesson to earn your first one.</p>'}
      ${upcoming ? `<p class="muted">Next: ${esc(upcoming.icon)} ${esc(upcoming.title)}: ${esc(upcoming.text)}</p>` : ''}
      <a href="#/progress">See all progress</a>
    </section>`;
}

export function renderDashboard(root, modules) {
  const stats = getStats();
  const info = levelInfo(stats.xp);
  const next = nextLesson(modules);
  const backupNudge = !stats.lastExport && stats.lessonsDone >= 3
    ? '<p class="nudge">💾 Your progress is saved only in this browser. <a href="#/settings">Download a backup</a>.</p>'
    : '';

  root.innerHTML = `
    <h1>${stats.lessonsDone ? 'Welcome back 👋' : 'Welcome to CodeQuest Academy 👋'}</h1>
    <div class="dash-top">
      ${continueCard(next, stats.lessonsDone)}
      <section class="card level-card" aria-labelledby="level-h">
        <h2 id="level-h" class="sr-only">Your level</h2>
        ${levelRing(info)}
        <p><strong>${stats.xp} XP</strong><br><span class="muted">${info.next - stats.xp} XP to level ${info.level + 1}</span></p>
      </section>
    </div>
    <ul class="stat-row" aria-label="Your numbers">
      <li class="card stat"><span class="stat-num">🔥 ${stats.streak}</span><span class="muted">day streak${stats.bestStreak > stats.streak ? ` (best ${stats.bestStreak})` : ''}</span></li>
      <li class="card stat"><span class="stat-num">✅ ${stats.lessonsDone}</span><span class="muted">lesson${stats.lessonsDone === 1 ? '' : 's'} done</span></li>
      <li class="card stat"><span class="stat-num">🧩 ${stats.exercisesSolved}</span><span class="muted">exercise${stats.exercisesSolved === 1 ? '' : 's'} solved</span></li>
    </ul>
    ${backupNudge}
    <div class="dash-columns">
      ${upNext(next)}
      ${achievementsCard(modules)}
    </div>
    <h2>Your modules</h2>
    <ul class="module-grid">${moduleCards(modules)}</ul>`;
  document.title = 'CodeQuest Academy';
}
