import { getStats, getAchievements, levelInfo, doneCount } from './store.js';

// Achievements are worked out from what is already saved. Only the date they were unlocked is stored.
// meter(stats) gives [have, need] for achievements you count towards.
const count = (key, need) => ({ test: (s) => s[key] >= need, meter: (s) => [Math.min(s[key], need), need] });

export const ACHIEVEMENTS = [
  { id: 'first-lesson', icon: '🌱', title: 'First steps', text: 'Complete your first lesson.', ...count('lessonsDone', 1) },
  { id: 'first-exercise', icon: '🧩', title: 'Problem solver', text: 'Solve your first exercise.', ...count('exercisesSolved', 1) },
  { id: 'ten-exercises', icon: '🔟', title: 'Ten down', text: 'Solve 10 exercises.', ...count('exercisesSolved', 10) },
  { id: 'fifty-exercises', icon: '🏅', title: 'Fifty solved', text: 'Solve 50 exercises.', ...count('exercisesSolved', 50) },
  { id: 'perfect-quiz', icon: '🎯', title: 'Sharp mind', text: 'Get full marks on a quiz.', ...count('quizzesPerfect', 1) },
  { id: 'streak-3', icon: '🔥', title: 'Warming up', text: 'Practise 3 days in a row.', ...count('bestStreak', 3) },
  { id: 'streak-7', icon: '🚀', title: 'On fire', text: 'Practise 7 days in a row.', ...count('bestStreak', 7) },
  { id: 'level-5', icon: '⭐', title: 'Level 5', text: 'Reach level 5.', test: (s) => levelInfo(s.xp).level >= 5, meter: (s) => [Math.min(levelInfo(s.xp).level, 5), 5] },
  { id: 'typist', icon: '⌨️', title: 'Fast fingers', text: 'Type 30 words a minute with 95% accuracy.', ...count('bestTypingWpm', 30) },
  { id: 'arena-clear', icon: '🏟️', title: 'Arena champion', text: 'Solve every exercise in a Challenge arena run.', ...count('arenaClears', 1) },
  { id: 'reviewer', icon: '🔁', title: 'Good memory', text: 'Review 20 flashcards or quiz questions.', ...count('reviews', 20) },
  { id: 'writer', icon: '✍️', title: 'Writer', text: 'Write a draft of 50 characters or more in the LinkedIn room.', ...count('draftsWritten', 1) },
  { id: 'builder', icon: '🛠️', title: 'Builder', text: 'Tick 5 steps in the Project workshop.', ...count('projectSteps', 5) },
  { id: 'backup', icon: '💾', title: 'Safe and sound', text: 'Download a backup of your progress.', test: (s) => Boolean(s.lastExport) },
  {
    id: 'module-done', icon: '🏆', title: 'Module master', text: 'Finish every lesson in one module.',
    test: (s, modules) => modules.some((m) => m.lessons.length > 0 && doneCount(m.id) >= m.lessons.length),
  },
];

// Every achievement with unlocked (true or false) and the date it was unlocked.
export function evaluateAchievements(modules) {
  const stats = getStats();
  const dates = getAchievements();
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.test(stats, modules),
    date: dates[a.id],
    progress: a.meter ? a.meter(stats) : null,
  }));
}
