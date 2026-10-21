import { esc, inline } from './html.js';
import { renderQuiz } from './quiz.js';
import { mountCodeBox, warmUp } from './codebox.js';
import { mountExercise } from './exercise.js';
import { isDone, completeLesson } from '../store.js';

function copyBox(heading, b, buttonLabel, preClass) {
  return `
      <section class="pc-box">
        <h2>${esc(heading)}</h2>
        ${b.text ? `<p>${inline(b.text)}</p>` : ''}
        <pre class="code${preClass}"><code>${esc(b.code)}</code></pre>
        <button class="btn btn-ghost copy-btn" type="button">${buttonLabel}</button>
        <span class="copy-status" role="status"></span>
      </section>`;
}

function block(b) {
  switch (b.type) {
    case 'text': return `<p>${inline(b.text)}</p>`;
    case 'code': return `<pre class="code"><code>${esc(b.code)}</code></pre>`;
    case 'tip': return `<aside class="tip"><strong>💡 Tip:</strong> ${inline(b.text)}</aside>`;
    // Code that cannot run in the browser (real files, email, the web). Shown with a Copy button.
    case 'pc': return copyBox(`💻 Take it to your PC: ${b.title}`, b, 'Copy code', '');
    // Text the learner can copy and fill in, such as a post or a README. Long lines wrap.
    case 'template': return copyBox(`📝 Template: ${b.title}`, b, 'Copy template', ' wrap');
    case 'list': return `<ul>${b.items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`;
    default: return '';
  }
}

export function renderLesson(root, module, lessonId, lesson) {
  const i = module.lessons.findIndex((l) => l.id === lessonId);
  const prev = module.lessons[i - 1];
  const next = module.lessons[i + 1];
  const link = (l, label) => l
    ? `<a class="btn" href="#/lesson/${esc(module.id)}/${esc(l.id)}">${label}</a>`
    : '<span></span>';

  // Examples run in the browser unless the lesson says "run": false.
  const examples = (lesson.examples ?? []).map((e, i) => `
    <section class="example">
      <h3>${esc(e.title)}</h3>
      ${e.run === false
        ? `<pre class="code${e.wrap ? ' wrap' : ''}"><code>${esc(e.code)}</code></pre>`
        : `<div class="codebox" data-i="${i}"></div>`}
    </section>`).join('');

  root.innerHTML = `
    <p><a href="#/module/${esc(module.id)}">← ${esc(module.title)}</a></p>
    <article class="lesson">
      <h1>${esc(lesson.title)}</h1>
      ${lesson.explanation.map(block).join('')}
      ${examples ? `<h2>Examples</h2>${examples}` : ''}
    </article>
    ${lesson.exercises?.length ? `
    <section class="exercises">
      <h2>Exercises</h2>
      ${lesson.exercises.map(() => '<section class="exercise"></section>').join('')}
    </section>` : ''}
    ${lesson.quiz?.length ? '<section class="quiz"></section>' : ''}
    <div class="complete-box" role="status"></div>
    <nav class="lesson-nav" aria-label="Lesson navigation">
      ${link(prev, '← Previous')}
      ${link(next, 'Next →')}
    </nav>`;
  document.title = `${lesson.title} · CodeQuest Academy`;
  const boxes = root.querySelectorAll('.example .codebox');
  boxes.forEach((el) => mountCodeBox(el, lesson.examples[el.dataset.i].code));
  const exerciseEls = root.querySelectorAll('.exercise');
  exerciseEls.forEach((el, i) => mountExercise(el, module.id, lessonId, i, lesson.exercises[i]));
  // Start loading Python now; errors show when the learner presses Run.
  if (boxes.length || exerciseEls.length) warmUp().catch(() => {});
  if (lesson.quiz?.length) renderQuiz(root.querySelector('.quiz'), module.id, lessonId, lesson.quiz);
  root.querySelectorAll('.pc-box').forEach(wireCopy);
  renderCompleteBox(root.querySelector('.complete-box'), module.id, lessonId);
}

function wireCopy(box) {
  const status = box.querySelector('.copy-status');
  box.querySelector('.copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(box.querySelector('pre code').textContent);
      status.textContent = 'Copied!';
    } catch {
      status.textContent = 'Could not copy. Select the code and press Ctrl+C.';
    }
  });
}

function renderCompleteBox(box, moduleId, lessonId, gained = 0) {
  if (isDone(moduleId, lessonId)) {
    box.innerHTML = `✓ Lesson complete${gained ? ` · +${gained} XP 🎉` : ''}`;
    return;
  }
  box.innerHTML = '<button class="btn" type="button">Mark as complete</button>';
  box.querySelector('button').addEventListener('click', () => {
    renderCompleteBox(box, moduleId, lessonId, completeLesson(moduleId, lessonId));
  });
}
