import { esc, focusScrollable } from './html.js';
import { mountCodeBox } from './codebox.js';
import { renderPrompt } from './exercise.js';
import { isDone, recordChallenge, arenaBonusAvailable, ARENA_XP_EACH, ARENA_XP_CLEAR } from '../store.js';
import { loadLesson } from '../content.js';
import { backLink } from './practice.js';

const COUNT = 3;
const TIME_LIMIT = 600; // seconds
const MAX_LOADS = 15; // lessons to try while looking for exercises

const shuffle = (list) => list.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Picks up to COUNT exercises, each from a different lesson you have finished.
async function pickChallenges(modules) {
  const finished = modules.flatMap((m) => m.lessons.filter((l) => isDone(m.id, l.id)).map((l) => [m, l]));
  const picks = [];
  for (const [m, l] of shuffle(finished).slice(0, MAX_LOADS)) {
    if (picks.length === COUNT) break;
    const lesson = await loadLesson(m.id, l.id).catch(() => null);
    const exercises = lesson?.exercises?.filter((e) => e.tests?.length) ?? [];
    if (exercises.length) picks.push({ exercise: shuffle(exercises)[0], lessonTitle: lesson.title });
  }
  return picks;
}

// Challenge arena: a few exercises from lessons you finished, against the clock, with no hints.
export function renderChallenge(root, modules) {
  const available = arenaBonusAvailable();
  const finishedLessons = modules.reduce((n, m) => n + m.lessons.filter((l) => isDone(m.id, l.id)).length, 0);
  root.innerHTML = `
    ${backLink()}
    <h1>Challenge arena</h1>
    <section class="card" aria-labelledby="rules-h">
      <h2 id="rules-h">How it works</h2>
      <ul>
        <li>You get up to ${COUNT} exercises, each from a different lesson you finished.</li>
        <li>You have ${TIME_LIMIT / 60} minutes. There are no hints and no solutions until the end.</li>
        <li>Bonus XP: +${ARENA_XP_EACH} for each one you solve, and +${ARENA_XP_CLEAR} more for solving all of them. The bonus can be earned <strong>once a day</strong>.
          ${available ? 'Today\'s bonus is still available.' : 'Today\'s bonus is already taken, but you can still play for practice.'}</li>
      </ul>
      ${finishedLessons
        ? '<button class="btn" type="button" id="start-arena">Start the challenge</button>'
        : '<p>Finish a lesson that has exercises first. <a href="#/roadmap">Open the roadmap</a></p>'}
    </section>
    <div id="arena"></div>`;
  document.title = 'Challenge arena · CodeQuest Academy';
  root.querySelector('#start-arena')?.addEventListener('click', () => start(root, modules));
}

async function start(root, modules) {
  const arena = root.querySelector('#arena');
  root.querySelector('#start-arena').disabled = true;
  arena.innerHTML = '<p class="loading">Choosing your challenges…</p>';
  const picks = await pickChallenges(modules);
  if (!picks.length) {
    arena.innerHTML = '<p>None of your finished lessons has an exercise yet. Try a lesson with exercises first.</p>';
    root.querySelector('#start-arena').disabled = false;
    return;
  }

  const solved = new Set();
  let left = TIME_LIMIT;
  let over = false;
  arena.innerHTML = `
    <div class="arena-bar">
      <p class="timer" role="timer" aria-label="Time left">${clock(left)}</p>
      <p class="arena-count" id="arena-count">0 of ${picks.length} solved</p>
      <button class="btn btn-ghost" type="button" id="finish-now">Finish now</button>
    </div>
    <p id="arena-note" class="sr-only" role="status"></p>
    ${picks.map((p, i) => `
      <section class="exercise arena-ex" aria-labelledby="ch-${i}">
        <h2 id="ch-${i}">Challenge ${i + 1} <span class="done-mark" hidden>✓ Solved</span></h2>
        <p class="muted">From “${esc(p.lessonTitle)}”</p>
        ${renderPrompt(p.exercise.prompt)}
        <div class="codebox"></div>
      </section>`).join('')}`;
  const cards = [...arena.querySelectorAll('.arena-ex')];
  const timer = arena.querySelector('.timer');
  const note = arena.querySelector('#arena-note');
  const count = arena.querySelector('#arena-count');
  picks.forEach((p, i) => mountCodeBox(cards[i].querySelector('.codebox'), p.exercise.starterCode, {
    tests: p.exercise.tests,
    input: p.exercise.input,
    onCheck: (passed) => {
      if (!passed || over || solved.has(i)) return;
      solved.add(i);
      cards[i].querySelector('.done-mark').hidden = false;
      count.textContent = `${solved.size} of ${picks.length} solved`;
      if (solved.size === picks.length) end();
    },
  }));
  arena.querySelector('#finish-now').addEventListener('click', () => end());
  arena.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  const tick = setInterval(() => {
    if (!document.body.contains(timer)) return clearInterval(tick); // you left the page
    left--;
    timer.textContent = clock(Math.max(left, 0));
    if (left === 60) note.textContent = 'One minute left.';
    if (left <= 0) end();
  }, 1000);

  function end() {
    if (over) return;
    over = true;
    clearInterval(tick);
    const { bonus } = recordChallenge(solved.size, picks.length);
    const used = TIME_LIMIT - Math.max(left, 0);
    const clear = solved.size === picks.length;
    arena.innerHTML = `
      <section class="card" aria-labelledby="res-h">
        <h2 id="res-h">${clear ? '🏆 You cleared the arena!' : `You solved ${solved.size} of ${picks.length}`}</h2>
        <p>Time used: ${clock(used)}.
          ${bonus ? `<strong>+${bonus} XP</strong> bonus for today.` : (solved.size ? 'Today\'s bonus was already taken, so no extra XP this time.' : 'No bonus this time. Try again!')}</p>
        <ul class="plain-list">${picks.map((p, i) => `
          <li><span aria-hidden="true">${solved.has(i) ? '✓' : '✗'}</span> <strong>${solved.has(i) ? 'Solved' : 'Not solved'}</strong>: ${esc(p.lessonTitle)}
            ${solved.has(i) ? '' : `<details><summary>Show one solution</summary><pre class="code"><code>${esc(p.exercise.solution)}</code></pre></details>`}</li>`).join('')}
        </ul>
        <div class="dialog-actions">
          <button class="btn btn-ghost" type="button" id="play-again">Play again</button>
          <a class="btn btn-link" href="#/practice">Back to Practice</a>
        </div>
      </section>`;
    focusScrollable(arena);
    arena.querySelector('#res-h').setAttribute('tabindex', '-1');
    arena.querySelector('#res-h').focus();
    arena.querySelector('#play-again').addEventListener('click', () => renderChallenge(root, modules));
  }
}
