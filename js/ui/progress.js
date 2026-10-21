import { esc, bar } from './html.js';
import { doneCount, getStats, getActivity, levelInfo } from '../store.js';
import { evaluateAchievements } from '../achievements.js';

const WEEKS = 12;

function localDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The last 12 weeks, one square per day. Colour shows how much you did, and the text is for screen readers.
function calendar() {
  const activity = getActivity();
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (WEEKS * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // start on a Sunday
  const cells = [];
  let active = 0;
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = localDate(d);
    const n = activity[key] ?? 0;
    if (n) active++;
    const level = n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : 3;
    cells.push(`<li class="day l${level}"><span class="sr-only">${key}: ${n} ${n === 1 ? 'thing' : 'things'} done</span></li>`);
  }
  return `
    <section class="card" aria-labelledby="cal-h">
      <h2 id="cal-h">Active days</h2>
      <p class="muted">You practised on <strong>${active}</strong> of the last ${WEEKS * 7} days.</p>
      <ol class="cal" aria-label="Activity for the last ${WEEKS} weeks">${cells.join('')}</ol>
    </section>`;
}

function achievementCard(a) {
  const meter = a.progress && !a.unlocked ? `<span class="muted">${a.progress[0]} / ${a.progress[1]}</span>` : '';
  return `
    <li class="card ach ${a.unlocked ? 'on' : 'off'}">
      <span class="ach-icon" aria-hidden="true">${a.unlocked ? esc(a.icon) : '🔒'}</span>
      <div>
        <h3>${esc(a.title)} <span class="sr-only">${a.unlocked ? '(unlocked)' : '(locked)'}</span></h3>
        <p>${esc(a.text)}</p>
        ${a.unlocked ? `<span class="muted">Unlocked ${esc(a.date ?? '')}</span>` : meter}
      </div>
    </li>`;
}

export function renderProgress(root, modules) {
  const stats = getStats();
  const info = levelInfo(stats.xp);
  const rows = modules.map((m) => {
    const done = doneCount(m.id);
    const total = m.lessons.length;
    return `
      <li>
        <div class="row-head"><span><span aria-hidden="true">${esc(m.icon)}</span> ${esc(m.title)}</span><span class="muted">${done} / ${total}</span></div>
        ${bar(total ? (done / total) * 100 : 0, `${m.title} progress`)}
      </li>`;
  }).join('');
  const achievements = evaluateAchievements(modules);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  root.innerHTML = `
    <h1>Progress and achievements</h1>
    <ul class="stat-row" aria-label="Your numbers">
      <li class="card stat"><span class="stat-num">⭐ Level ${info.level}</span><span class="muted">${stats.xp} XP · ${info.next - stats.xp} to level ${info.level + 1}</span>${bar(info.percent, 'Progress to the next level')}</li>
      <li class="card stat"><span class="stat-num">🔥 ${stats.streak}</span><span class="muted">day streak · best ${stats.bestStreak}</span></li>
      <li class="card stat"><span class="stat-num">✅ ${stats.lessonsDone}</span><span class="muted">lessons · ${stats.exercisesSolved} exercises · ${stats.quizzesPerfect} perfect quizzes</span></li>
    </ul>
    <div class="dash-columns">
      <section class="card" aria-labelledby="mods-h">
        <h2 id="mods-h">Modules</h2>
        <ul class="plain-list bars">${rows}</ul>
      </section>
      ${calendar()}
    </div>
    <h2>Achievements <span class="muted">${unlocked} of ${achievements.length}</span></h2>
    <ul class="ach-grid">${achievements.map(achievementCard).join('')}</ul>`;
  document.title = 'Progress · CodeQuest Academy';
}
