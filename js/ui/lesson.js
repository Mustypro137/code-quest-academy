import { esc, inline } from './html.js';
import { renderQuiz } from './quiz.js';
import { mountCodeBox, warmUp } from './codebox.js';
import { mountExercise } from './exercise.js';
import { mountTyping } from './typing.js';
import { isDone, completeLesson, recordAnswer, REVIEW_INDEX } from '../store.js';
import { MOVES } from '../moves.js';
import { lessonStates } from '../path.js';

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
    // Typing drill (mounted after the page is drawn).
    case 'typing': return '<section class="typing"></section>';
    case 'list': return `<ul>${b.items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`;
    default: return '';
  }
}

const KIND = { browser: '▶ Runs in the page', pc: '💻 Run on your own PC', checkpoint: '★ Checkpoint' };

// A prerequisite may use an old lesson id: translate it, then look up the title.
function prerequisiteLink(id, modules) {
  const now = MOVES[id] ?? id;
  const [moduleId, lessonId] = now.split('/');
  const found = modules?.find((m) => m.id === moduleId)?.lessons.find((l) => l.id === lessonId);
  return found
    ? `<a class="chip" href="#/lesson/${esc(moduleId)}/${esc(lessonId)}">${esc(found.title)}</a>`
    : `<span class="chip">${esc(id)}</span>`;
}

// Goal, kind of lesson and prerequisites (curriculum lessons only).
function lessonHeader(lesson, modules) {
  if (!lesson.objective && !lesson.kind && !lesson.prerequisites?.length) return '';
  return `
    <div class="lesson-meta">
      ${lesson.kind ? `<span class="badge">${KIND[lesson.kind] ?? ''}</span>` : ''}
      ${lesson.objective ? `<p class="objective"><strong>Goal:</strong> ${inline(lesson.objective)}</p>` : ''}
      ${lesson.prerequisites?.length ? `<p class="meta"><strong>Before this lesson:</strong> ${lesson.prerequisites.map((p) => prerequisiteLink(p, modules)).join(' ')}</p>` : ''}
    </div>`;
}

// Each important line of an example, with one plain sentence about it.
function walkthroughHtml(list) {
  if (!list?.length) return '';
  return `<h2>Code, line by line</h2>${list.map((w) => `
    <section class="walk">
      <h3>${esc(w.title)}</h3>
      <pre class="code"><code>${esc(w.code)}</code></pre>
      <ol class="line-notes">${w.lines.map((l) => `<li><code>${esc(l.line)}</code><span>${inline(l.explain)}</span></li>`).join('')}</ol>
    </section>`).join('')}`;
}

function mistakesHtml(list) {
  if (!list?.length) return '';
  return `<h2>Common mistakes</h2><ul class="mistakes">${list.map((m) => `
    <li><strong>${inline(m.mistake)}</strong>
      <span><span class="muted">Why:</span> ${inline(m.why)}</span>
      <span><span class="muted">Fix:</span> ${inline(m.fix)}</span></li>`).join('')}</ul>`;
}

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Everything the learner solves in the right-hand panel, in order: exercises, debug tasks, the challenge.
// The position in this list is the exercise number that progress is saved under.
function buildTasks(lesson) {
  const tasks = (lesson.exercises ?? []).map((ex) => ({ group: 'Exercises', ex }));
  (lesson.debug ?? []).forEach((d, i) => tasks.push({
    group: 'Debug it',
    ex: {
      heading: `Debug ${i + 1}: ${d.title}`,
      prompt: `**What goes wrong:** \`${d.symptom.replaceAll('`', "'")}\`\n\n${d.prompt}`,
      starterCode: d.brokenCode, tests: d.tests, hints: d.hints, solution: d.solution, input: d.input,
    },
  }));
  if (lesson.challenge) {
    const c = lesson.challenge;
    tasks.push({
      group: 'Mini-challenge',
      ex: { ...c, heading: `Challenge: ${c.title}`, prompt: c.prompt + (c.stretch ? `\n\n**Stretch idea (not tested):** ${c.stretch}` : '') },
    });
  }
  return tasks;
}

// One question from an earlier lesson. A wrong answer goes on the Revision list.
function mountReview(box, moduleId, lessonId, review, modules) {
  const [fromModule, fromLesson] = (MOVES[review.from] ?? review.from).split('/');
  const from = modules?.find((m) => m.id === fromModule)?.lessons.find((l) => l.id === fromLesson);
  box.innerHTML = `
    <h2 id="review-h">Review from an earlier lesson</h2>
    <p class="muted">${from ? `From <a href="#/lesson/${esc(fromModule)}/${esc(fromLesson)}">${esc(from.title)}</a>` : 'From an earlier lesson'}</p>
    <h3 id="review-q">${inline(review.question)}</h3>
    <div class="quiz-options" role="group" aria-labelledby="review-q">
      ${review.options.map((o, n) => `<button class="quiz-option" type="button" data-n="${n}">${inline(o)}</button>`).join('')}
    </div>
    <div class="quiz-feedback" role="status"></div>`;
  const buttons = [...box.querySelectorAll('.quiz-option')];
  buttons.forEach((button) => button.addEventListener('click', () => {
    const ok = Number(button.dataset.n) === review.answer;
    recordAnswer(moduleId, lessonId, REVIEW_INDEX, ok);
    buttons.forEach((b, n) => {
      b.disabled = true;
      if (n === review.answer) b.classList.add('correct');
      else if (b === button) b.classList.add('wrong');
    });
    box.querySelector('.quiz-feedback').innerHTML = `<p><strong>${ok ? '✓ Correct!' : '✗ Not quite. It is on your Revision list.'}</strong> ${inline(review.explanation)}</p>`;
  }));
}

export function renderLesson(root, module, lessonId, lesson, modules) {
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

  // Locks are only a suggestion: a locked lesson opens, with a note.
  const lockNote = lessonStates(module)[i] === 'locked' ? `
    <p class="notice" role="note">🔒 The roadmap suggests finishing
      <a href="#/lesson/${esc(module.id)}/${esc(prev.id)}">“${esc(prev.title)}”</a> first. You can still read this lesson.</p>` : '';
  const tasks = buildTasks(lesson);
  const hasPractice = tasks.length > 0;
  let lastGroup = null;
  const practice = tasks.map((t, n) => {
    const heading = t.group !== lastGroup ? `<h2${n === 0 ? ' id="practice-h"' : ''}>${t.group}</h2>` : '';
    lastGroup = t.group;
    return `${heading}<section class="exercise"></section>`;
  }).join('');

  root.innerHTML = `
    <p><a href="#/roadmap">← Roadmap</a> · <a href="#/module/${esc(module.id)}">${esc(module.title)}</a></p>
    ${lockNote}
    ${hasPractice ? `<div class="jump" role="group" aria-label="Jump to">
      <button class="btn btn-ghost" type="button" data-jump=".lesson">📖 Learn</button>
      <button class="btn btn-ghost" type="button" data-jump=".exercises">🧪 Practise</button>
    </div>` : ''}
    <div class="lesson-layout${hasPractice ? ' two' : ''}">
    <article class="lesson">
      <h1>${esc(lesson.title)}</h1>
      ${lessonHeader(lesson, modules)}
      ${lesson.explanation.map(block).join('')}
      ${walkthroughHtml(lesson.walkthrough)}
      ${examples ? `<h2>Examples</h2>${examples}` : ''}
      ${mistakesHtml(lesson.mistakes)}
    </article>
    ${hasPractice ? `<section class="exercises" aria-labelledby="practice-h">${practice}</section>` : ''}
    </div>
    ${lesson.quiz?.length ? '<section class="quiz"></section>' : ''}
    ${lesson.review ? '<section class="card review" aria-labelledby="review-h"></section>' : ''}
    <div class="complete-box" role="status"></div>
    <nav class="lesson-nav" aria-label="Lesson navigation">
      ${link(prev, '← Previous')}
      ${link(next, 'Next →')}
    </nav>`;
  document.title = `${lesson.title} · CodeQuest Academy`;
  const boxes = root.querySelectorAll('.example .codebox');
  boxes.forEach((el) => {
    const example = lesson.examples[el.dataset.i];
    mountCodeBox(el, example.code, { input: example.input });
  });
  const drills = lesson.explanation.filter((b) => b.type === 'typing');
  root.querySelectorAll('.typing').forEach((el, i) => mountTyping(el, module.id, lessonId, i, drills[i]));
  const exerciseEls = root.querySelectorAll('.exercise');
  exerciseEls.forEach((el, n) => mountExercise(el, module.id, lessonId, n, tasks[n].ex));
  // Start loading Python now; errors show when the learner presses Run.
  if (boxes.length || exerciseEls.length) warmUp().catch(() => {});
  const completeBox = root.querySelector('.complete-box');
  if (lesson.quiz?.length) {
    // A checkpoint is finished by passing its quiz.
    const pass = lesson.passPercent
      ? { percent: lesson.passPercent, onPass: () => renderCompleteBox(completeBox, module.id, lessonId, completeLesson(module.id, lessonId), lesson.passPercent) }
      : undefined;
    renderQuiz(root.querySelector('.quiz'), module.id, lessonId, lesson.quiz, pass);
  }
  if (lesson.review) mountReview(root.querySelector('.review'), module.id, lessonId, lesson.review, modules);
  root.querySelectorAll('.pc-box').forEach(wireCopy);
  root.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => {
    const target = root.querySelector(button.dataset.jump);
    target.setAttribute('tabindex', '-1');
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    target.focus({ preventScroll: true });
  }));
  renderCompleteBox(completeBox, module.id, lessonId, 0, lesson.passPercent);
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

// passPercent is set for checkpoints: they are finished by passing the quiz, not by a button.
function renderCompleteBox(box, moduleId, lessonId, gained = 0, passPercent = 0) {
  if (isDone(moduleId, lessonId)) {
    box.innerHTML = `✓ ${passPercent ? 'Checkpoint passed' : 'Lesson complete'}${gained ? ` · +${gained} XP 🎉` : ''}`;
    return;
  }
  if (passPercent) {
    box.textContent = `Score at least ${passPercent}% on the quiz to pass this checkpoint.`;
    return;
  }
  box.innerHTML = '<button class="btn" type="button">Mark as complete</button>';
  box.querySelector('button').addEventListener('click', () => {
    renderCompleteBox(box, moduleId, lessonId, completeLesson(moduleId, lessonId));
  });
}
