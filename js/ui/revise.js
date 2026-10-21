import { esc, inline } from './html.js';
import { getMissed, getDueCards, reviewCard, reviewQuestion, recordAnswer } from '../store.js';
import { loadLesson } from '../content.js';
import { backLink } from './practice.js';

const SESSION_SIZE = 10;

const shuffle = (list) => list.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

// Revision centre: missed quiz questions, and glossary flashcards that are due.
export function renderRevise(root, cards) {
  const missed = getMissed();
  const due = getDueCards(cards.map((c) => c.id));

  root.innerHTML = `
    ${backLink()}
    <h1>Revision centre</h1>
    <p class="muted">Short sessions of up to ${SESSION_SIZE}. No XP here: this is just to help things stick.</p>
    <div class="practice-pair">
      <section class="card" aria-labelledby="rq-h">
        <h2 id="rq-h">Quiz questions to review</h2>
        <p>${missed.length ? `${missed.length} question${missed.length === 1 ? '' : 's'} you got wrong.` : 'Nothing to review. Questions you miss in a quiz will appear here.'}</p>
        <button class="btn" type="button" id="start-questions"${missed.length ? '' : ' disabled'}>Start review</button>
      </section>
      <section class="card" aria-labelledby="rf-h">
        <h2 id="rf-h">Flashcards</h2>
        <p>${due.length ? `${due.length} card${due.length === 1 ? '' : 's'} due today.` : 'All caught up. Come back tomorrow.'}</p>
        <button class="btn" type="button" id="start-cards"${due.length ? '' : ' disabled'}>Start flashcards</button>
      </section>
    </div>
    <div id="session" tabindex="-1"></div>`;
  document.title = 'Revision centre · CodeQuest Academy';

  const session = root.querySelector('#session');
  const finish = (title, text) => {
    session.innerHTML = `<section class="card" aria-labelledby="done-h"><h2 id="done-h">${esc(title)}</h2><p>${esc(text)}</p>
      <button class="btn" type="button" id="again">Back to the Revision centre</button></section>`;
    session.focus();
    session.querySelector('#again').addEventListener('click', () => renderRevise(root, cards));
  };

  root.querySelector('#start-questions').addEventListener('click', async () => {
    const items = [];
    for (const key of missed) {
      const [m, l, i] = key.split('/');
      const lesson = await loadLesson(m, l).catch(() => null);
      const q = lesson?.quiz?.[Number(i)];
      if (q) items.push({ key, q, title: lesson.title });
      else recordAnswer(m, l, Number(i), true); // the lesson changed: drop the stale question
    }
    const queue = shuffle(items).slice(0, SESSION_SIZE);
    if (!queue.length) return finish('Nothing to review', 'Those questions are no longer in the lessons.');
    let index = 0;
    let right = 0;

    const show = () => {
      const { key, q, title } = queue[index];
      session.innerHTML = `
        <section class="card" aria-labelledby="rq-q">
          <p class="muted">Question ${index + 1} of ${queue.length} · from “${esc(title)}”</p>
          <h2 id="rq-q">${inline(q.question)}</h2>
          <div class="quiz-options" role="group" aria-labelledby="rq-q">
            ${q.options.map((o, n) => `<button class="quiz-option" type="button" data-n="${n}">${inline(o)}</button>`).join('')}
          </div>
          <div class="quiz-feedback" role="status"></div>
        </section>`;
      session.focus();
      const buttons = [...session.querySelectorAll('.quiz-option')];
      buttons.forEach((button) => button.addEventListener('click', () => {
        const ok = Number(button.dataset.n) === q.answer;
        if (ok) right++;
        reviewQuestion(key, ok);
        buttons.forEach((b, n) => {
          b.disabled = true;
          if (n === q.answer) b.classList.add('correct');
          else if (b === button) b.classList.add('wrong');
        });
        const last = index === queue.length - 1;
        session.querySelector('.quiz-feedback').innerHTML = `
          <p><strong>${ok ? '✓ Correct! It is off your list.' : '✗ Not quite. It stays on your list.'}</strong> ${inline(q.explanation)}</p>
          <button class="btn" type="button" id="next">${last ? 'Finish' : 'Next question'}</button>`;
        const next = session.querySelector('#next');
        next.addEventListener('click', () => (last ? finish('Review done', `You got ${right} of ${queue.length} right.`) : (index++, show())));
        next.focus();
      }));
    };
    show();
  });

  root.querySelector('#start-cards').addEventListener('click', () => {
    const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
    const queue = due.slice(0, SESSION_SIZE).map((id) => byId[id]);
    const retried = new Set();
    let known = 0;
    let seen = 0;

    const show = () => {
      if (!queue.length) return finish('Flashcards done', `You knew ${known} of ${seen} cards. Cards you missed come back tomorrow.`);
      const card = queue[0];
      session.innerHTML = `
        <section class="card flash" aria-labelledby="fc-t">
          <p class="muted">${queue.length} card${queue.length === 1 ? '' : 's'} left</p>
          <h2 id="fc-t">${esc(card.term)}</h2>
          <p class="flash-answer" id="fc-a" hidden>${esc(card.definition)}</p>
          <button class="btn" type="button" id="reveal" aria-controls="fc-a">Show the answer</button>
          <div class="flash-actions" hidden>
            <button class="btn btn-ghost" type="button" id="miss">Not yet</button>
            <button class="btn" type="button" id="know">I knew it</button>
          </div>
        </section>`;
      session.focus();
      const reveal = session.querySelector('#reveal');
      reveal.addEventListener('click', () => {
        session.querySelector('#fc-a').hidden = false;
        session.querySelector('.flash-actions').hidden = false;
        reveal.hidden = true;
        session.querySelector('#know').focus();
      });
      const answer = (knew) => {
        reviewCard(card.id, knew);
        queue.shift();
        if (!retried.has(card.id)) seen++;
        if (knew) known++;
        if (!knew && !retried.has(card.id)) { retried.add(card.id); queue.push(card); } // one more try this session
        show();
      };
      session.querySelector('#know').addEventListener('click', () => answer(true));
      session.querySelector('#miss').addEventListener('click', () => answer(false));
    };
    show();
  });
}
