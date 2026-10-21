import { esc, inline, focusScrollable } from './html.js';
import { mountCodeBox } from './codebox.js';
import { isExerciseDone, completeExercise, EXERCISE_XP } from '../store.js';

const TRIES_BEFORE_SOLUTION = 2;

// A blank line starts a new paragraph. A block between lines of three backticks is shown as code.
export function renderPrompt(prompt) {
  return prompt.split(/```\n([\s\S]*?)\n```/).map((part, i) => (i % 2
    ? `<pre class="code"><code>${esc(part)}</code></pre>`
    : part.split('\n\n').filter((p) => p.trim()).map((p) => `<p>${inline(p)}</p>`).join(''))).join('');
}

// One exercise: prompt, code box with tests, hints, and a solution that unlocks
// after TRIES_BEFORE_SOLUTION failed checks (or once the exercise is solved).
// ex: { prompt, starterCode, tests, hints, solution, input? }  (input: lines for input() calls)
export function mountExercise(el, moduleId, lessonId, number, ex) {
  const heading = ex.heading ?? `Exercise ${number + 1}${ex.level ? ' · ' + ex.level.charAt(0).toUpperCase() + ex.level.slice(1) : ''}`;
  let failed = 0;
  let solved = isExerciseDone(moduleId, lessonId, number);
  let hintsShown = 0;
  const hints = ex.hints ?? [];

  el.innerHTML = `
    <h3>${esc(heading)}${solved ? ' <span class="done-mark">✓ Solved</span>' : ''}</h3>
    ${renderPrompt(ex.prompt)}
    <div class="codebox"></div>
    <p class="exercise-status" role="status"></p>
    <div class="exercise-help">
      <button class="btn btn-ghost hint-btn" type="button"></button>
      <button class="btn btn-ghost solution-btn" type="button"></button>
    </div>
    <ul class="hint-list"></ul>
    <div class="solution" hidden></div>`;

  const status = el.querySelector('.exercise-status');
  const hintBtn = el.querySelector('.hint-btn');
  const solutionBtn = el.querySelector('.solution-btn');

  function updateButtons() {
    const left = hints.length - hintsShown;
    hintBtn.hidden = hints.length === 0;
    hintBtn.disabled = left === 0;
    hintBtn.textContent = left ? `💡 Show a hint (${left} left)` : '💡 No more hints';

    const locked = !solved && failed < TRIES_BEFORE_SOLUTION;
    solutionBtn.disabled = locked || !el.querySelector('.solution').hidden;
    solutionBtn.textContent = locked
      ? `🔒 Solution unlocks after ${TRIES_BEFORE_SOLUTION - failed} more failed ${TRIES_BEFORE_SOLUTION - failed === 1 ? 'try' : 'tries'}`
      : '👀 Show the solution';
  }

  hintBtn.addEventListener('click', () => {
    el.querySelector('.hint-list').insertAdjacentHTML('beforeend', `<li>${inline(hints[hintsShown++])}</li>`);
    updateButtons();
  });

  solutionBtn.addEventListener('click', () => {
    const box = el.querySelector('.solution');
    box.innerHTML = `<p><strong>One possible solution:</strong></p><pre class="code"><code>${esc(ex.solution)}</code></pre>`;
    box.hidden = false;
    focusScrollable(box);
    updateButtons();
  });

  mountCodeBox(el.querySelector('.codebox'), ex.starterCode, {
    tests: ex.tests,
    input: ex.input,
    onCheck: (passed) => {
      if (passed) {
        const gained = completeExercise(moduleId, lessonId, number);
        solved = true;
        status.textContent = gained ? `✓ Solved! +${EXERCISE_XP} XP` : '✓ Solved again. Nice!';
        el.querySelector('h3').innerHTML = `${esc(heading)} <span class="done-mark">✓ Solved</span>`;
      } else {
        failed++;
        status.textContent = '';
      }
      updateButtons();
    },
  });

  updateButtons();
}
