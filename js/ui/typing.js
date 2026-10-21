import { esc } from './html.js';
import { getTypingBest, recordTyping, MIN_TYPING_ACCURACY } from '../store.js';

const round1 = (n) => Math.round(n * 10) / 10;

// Typing drill: type the target text; the timer starts on the first key.
// Speed counts correct characters only (5 characters = 1 word).
export function mountTyping(root, moduleId, lessonId, number, drill) {
  const target = drill.text;
  root.innerHTML = `
    <h2>⌨️ Typing practice: ${esc(drill.title)}</h2>
    <p>Type the text below. Aim for ${MIN_TYPING_ACCURACY}% accuracy or better. Pasting is turned off.</p>
    <p class="typing-target" data-target></p>
    <textarea class="editor typing-input" rows="3" spellcheck="false" autocomplete="off"
      autocapitalize="off" autocorrect="off" aria-label="Type the text here"></textarea>
    <div class="codebox-bar">
      <button class="btn btn-ghost" type="button" data-restart>Start again</button>
    </div>
    <p class="typing-result" role="status"></p>
    <p class="typing-best"></p>`;
  const targetEl = root.querySelector('[data-target]');
  const input = root.querySelector('textarea');
  const result = root.querySelector('.typing-result');
  const bestEl = root.querySelector('.typing-best');
  let startedAt = null;

  const showBest = () => {
    const best = getTypingBest(moduleId, lessonId, number);
    bestEl.textContent = best ? `Your best: ${best} WPM` : '';
  };

  function paint() {
    const typed = input.value;
    let correct = 0;
    targetEl.innerHTML = [...target].map((ch, i) => {
      const shown = ch === '\n' ? '↵\n' : esc(ch);
      let cls = 'pending';
      if (i < typed.length) {
        if (typed[i] === ch) { cls = 'ok'; correct++; } else cls = 'bad';
      } else if (i === typed.length) cls = 'cur';
      return `<span class="t-${cls}">${shown}</span>`;
    }).join('');
    return correct;
  }

  function finish(correct) {
    const seconds = Math.max((performance.now() - startedAt) / 1000, 1);
    const wpm = round1(correct / 5 / (seconds / 60));
    const accuracy = round1((correct * 100) / target.length);
    input.disabled = true;
    const saved = recordTyping(moduleId, lessonId, number, wpm, accuracy);
    let note = '';
    if (accuracy < MIN_TYPING_ACCURACY) note = ` Under ${MIN_TYPING_ACCURACY}% accuracy, so this try is not saved. Slow down and try again.`;
    else if (saved.isNewBest) note = ' New best! 🎉';
    result.textContent = `Done: ${wpm} WPM, ${accuracy}% accuracy.${note}`;
    showBest();
  }

  input.addEventListener('input', () => {
    if (startedAt === null && input.value) startedAt = performance.now();
    if (input.value.length > target.length) input.value = input.value.slice(0, target.length);
    const correct = paint();
    if (input.value.length >= target.length) finish(correct);
  });
  input.addEventListener('paste', (e) => e.preventDefault());
  root.querySelector('[data-restart]').addEventListener('click', () => {
    input.disabled = false;
    input.value = '';
    startedAt = null;
    result.textContent = '';
    paint();
    input.focus();
  });

  paint();
  showBest();
}
