import { inline } from './html.js';
import { getQuizBest, recordQuiz, recordAnswer } from '../store.js';

// Multiple-choice quiz, one question at a time.
// questions: [{ question, options: [...], answer: <index>, explanation }]
export function renderQuiz(box, moduleId, lessonId, questions) {
  let index = 0;
  let score = 0;

  function bestLine() {
    const best = getQuizBest(moduleId, lessonId);
    return best ? `<p class="quiz-best">Best score: ${best.best} / ${best.total}</p>` : '';
  }

  function start() {
    index = 0;
    score = 0;
    box.innerHTML = `
      <h2>Quick quiz</h2>
      ${bestLine()}
      <div class="quiz-body"></div>`;
    showQuestion();
  }

  function showQuestion() {
    const q = questions[index];
    const body = box.querySelector('.quiz-body');
    body.innerHTML = `
      <p class="quiz-progress">Question ${index + 1} of ${questions.length}</p>
      <h3 id="quiz-q">${inline(q.question)}</h3>
      <div class="quiz-options" role="group" aria-labelledby="quiz-q">
        ${q.options.map((o, i) => `<button class="quiz-option" type="button" data-i="${i}">${inline(o)}</button>`).join('')}
      </div>
      <div class="quiz-feedback" role="status"></div>`;

    const buttons = [...body.querySelectorAll('.quiz-option')];
    buttons.forEach((btn) => btn.addEventListener('click', () => answer(buttons, Number(btn.dataset.i))));
  }

  function answer(buttons, picked) {
    const q = questions[index];
    const right = picked === q.answer;
    if (right) score++;
    recordAnswer(moduleId, lessonId, index, right); // a wrong answer goes on the Revision list
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add('correct');
      else if (i === picked) b.classList.add('wrong');
    });

    const last = index === questions.length - 1;
    const body = box.querySelector('.quiz-body');
    body.querySelector('.quiz-feedback').innerHTML = `
      <p><strong>${right ? '✓ Correct!' : '✗ Not quite.'}</strong> ${inline(q.explanation)}</p>
      <button class="btn" type="button" id="quiz-next">${last ? 'See my score' : 'Next question'}</button>`;
    const next = body.querySelector('#quiz-next');
    next.addEventListener('click', () => (last ? finish() : (index++, showQuestion())));
    next.focus();
  }

  function finish() {
    const gained = recordQuiz(moduleId, lessonId, score, questions.length);
    const perfect = score === questions.length;
    box.querySelector('.quiz-body').innerHTML = `
      <p class="quiz-score">${perfect ? '🎉' : '👍'} You scored ${score} / ${questions.length}</p>
      ${gained ? `<p>+${gained} XP</p>` : ''}
      <button class="btn" type="button" id="quiz-again">Try again</button>`;
    box.querySelector('.quiz-best')?.remove();
    box.querySelector('h2').insertAdjacentHTML('afterend', bestLine());
    box.querySelector('#quiz-again').addEventListener('click', start);
  }

  start();
}
