import { esc } from './html.js';
import { getMissed, getDueCards, getChecks, getStats, arenaBonusAvailable } from '../store.js';

// The Practice page: four rooms, each with a one-line summary of where you are.
export function renderPractice(root, { cards, workshop }) {
  const missed = getMissed().length;
  const due = getDueCards(cards.map((c) => c.id)).length;
  const checks = getChecks();
  const total = workshop.projects.reduce((n, p) => n + p.steps.length, 0);
  const done = workshop.projects.reduce((n, p) => n + p.steps.filter((_, i) => `${p.id}/${i}` in checks).length, 0);
  const { draftsWritten } = getStats();

  const rooms = [
    ['#/practice/challenge', '🏟️', 'Challenge arena', 'Three exercises from lessons you finished. Ten minutes. No hints.',
      arenaBonusAvailable() ? 'Bonus XP available today' : "Today's bonus is taken"],
    ['#/practice/revise', '🔁', 'Revision centre', 'Go over quiz questions you missed, and practise key words with flashcards.',
      `${missed} question${missed === 1 ? '' : 's'} to review · ${due} flashcard${due === 1 ? '' : 's'} due`],
    ['#/practice/projects', '🛠️', 'Project workshop', 'Step-by-step checklists for the two projects, and a plan for your own.',
      `${done} of ${total} steps done`],
    ['#/practice/linkedin', '✍️', 'LinkedIn practice room', 'Write your headline, About section, project post and README.',
      `${draftsWritten} draft${draftsWritten === 1 ? '' : 's'} written`],
  ];
  root.innerHTML = `
    <h1>Practice</h1>
    <p class="muted">Rooms to practise what you learned. Pick one.</p>
    <ul class="module-grid">${rooms.map(([href, icon, title, text, tag]) => `
      <li><a class="module-card" href="${href}">
        <span class="icon" aria-hidden="true">${icon}</span>
        <h2>${esc(title)}</h2>
        <p>${esc(text)}</p>
        <span class="tag">${esc(tag)}</span>
      </a></li>`).join('')}
    </ul>`;
  document.title = 'Practice · CodeQuest Academy';
}

export function backLink() {
  return '<p><a href="#/practice">← Practice</a></p>';
}
