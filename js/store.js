// The only module that touches localStorage.
//
// Saved shape (all fields optional when loading):
//   theme      "light" | "dark"
//   completed  { "<moduleId>/<lessonId>": "YYYY-MM-DD" }  (date first completed)
//   xp         whole number
//   streak     days in a row, as of lastActive
//   quiz       { "<moduleId>/<lessonId>": { best, total } }  (best score so far)
//   exercises  { "<moduleId>/<lessonId>/<number>": "YYYY-MM-DD" }  (date first solved)
//   lastActive "YYYY-MM-DD" (local date)
//   lastExport "YYYY-MM-DD"
const KEY = 'cqa.progress';
const APP = 'codequest-academy';
export const LESSON_XP = 10;
export const QUIZ_XP = 2; // per point of improvement over your best score
export const EXERCISE_XP = 15;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LESSON_KEY = /^[\w-]+\/[\w-]+$/;
const EXERCISE_KEY = /^[\w-]+\/[\w-]+\/\d+$/;

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysBetween(a, b) {
  const t = (s) => Date.UTC(...s.split('-').map((n, i) => (i === 1 ? n - 1 : +n)));
  return Math.round((t(b) - t(a)) / 86400000);
}

// Builds a well-formed object from anything. Bad fields fall back to defaults.
function clean(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const completed = {};
  if (r.completed && typeof r.completed === 'object') {
    for (const [k, v] of Object.entries(r.completed)) {
      if (LESSON_KEY.test(k) && typeof v === 'string' && DATE.test(v)) completed[k] = v;
    }
  }
  const whole = (n) => (Number.isSafeInteger(n) && n >= 0 ? n : 0);
  const date = (s) => (typeof s === 'string' && DATE.test(s) ? s : undefined);
  const exercises = {};
  if (r.exercises && typeof r.exercises === 'object') {
    for (const [k, v] of Object.entries(r.exercises)) {
      if (EXERCISE_KEY.test(k) && typeof v === 'string' && DATE.test(v)) exercises[k] = v;
    }
  }
  const quiz = {};
  if (r.quiz && typeof r.quiz === 'object') {
    for (const [k, v] of Object.entries(r.quiz)) {
      if (LESSON_KEY.test(k) && v && whole(v.total) > 0 && whole(v.best) <= v.total) {
        quiz[k] = { best: whole(v.best), total: v.total };
      }
    }
  }
  return {
    theme: r.theme === 'light' || r.theme === 'dark' ? r.theme : undefined,
    completed,
    quiz,
    exercises,
    xp: whole(r.xp),
    streak: whole(r.streak),
    lastActive: date(r.lastActive),
    lastExport: date(r.lastExport),
  };
}

function load() {
  try {
    return clean(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return clean(null);
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage blocked or full: the app still works, it just forgets.
  }
}

export function getTheme() {
  return load().theme;
}

export function setTheme(theme) {
  save({ ...load(), theme });
}

export function isDone(moduleId, lessonId) {
  return `${moduleId}/${lessonId}` in load().completed;
}

export function doneCount(moduleId) {
  return Object.keys(load().completed).filter((k) => k.startsWith(`${moduleId}/`)).length;
}

// Counts today as an active day (updates the streak). Call before save().
function touchStreak(data) {
  const now = today();
  if (data.lastActive === now) return;
  data.streak = data.lastActive && daysBetween(data.lastActive, now) === 1 ? data.streak + 1 : 1;
  data.lastActive = now;
}

// Marks a lesson done. XP is given only the first time. Returns the XP gained.
export function completeLesson(moduleId, lessonId) {
  const data = load();
  const key = `${moduleId}/${lessonId}`;
  if (key in data.completed) return 0;

  data.completed[key] = today();
  data.xp += LESSON_XP;
  touchStreak(data);
  save(data);
  return LESSON_XP;
}

export function isExerciseDone(moduleId, lessonId, number) {
  return `${moduleId}/${lessonId}/${number}` in load().exercises;
}

// Marks an exercise solved. XP is given only the first time. Returns the XP gained.
export function completeExercise(moduleId, lessonId, number) {
  const data = load();
  const key = `${moduleId}/${lessonId}/${number}`;
  if (key in data.exercises) return 0;

  data.exercises[key] = today();
  data.xp += EXERCISE_XP;
  touchStreak(data);
  save(data);
  return EXERCISE_XP;
}

// Best quiz result for a lesson, or undefined if never taken.
export function getQuizBest(moduleId, lessonId) {
  return load().quiz[`${moduleId}/${lessonId}`];
}

// Saves a finished quiz. XP is given only for points above your previous best,
// so retaking a quiz cannot be used to farm XP. Returns the XP gained.
export function recordQuiz(moduleId, lessonId, score, total) {
  const data = load();
  const key = `${moduleId}/${lessonId}`;
  const prev = data.quiz[key];
  const prevBest = prev && prev.total === total ? prev.best : 0;
  touchStreak(data);
  const gained = Math.max(0, score - prevBest) * QUIZ_XP;
  if (!prev || prev.total !== total || score > prevBest) data.quiz[key] = { best: score, total };
  data.xp += gained;
  save(data);
  return gained;
}

export function getStats() {
  const d = load();
  // A streak is alive if you were active today or yesterday.
  const alive = d.lastActive && daysBetween(d.lastActive, today()) <= 1;
  return {
    xp: d.xp,
    streak: alive ? d.streak : 0,
    lessonsDone: Object.keys(d.completed).length,
    lastExport: d.lastExport,
  };
}

// Returns the backup file text and remembers the backup date.
export function exportProgress() {
  const data = { ...load(), lastExport: today() };
  save(data);
  return JSON.stringify({ app: APP, version: 1, ...data }, null, 2);
}

// Replaces all progress with a backup file. Keeps the current theme.
// Throws an Error with a simple message if the file is not a valid backup.
export function importProgress(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!raw || raw.app !== APP) throw new Error('That file is not a CodeQuest Academy backup.');
  save({ ...clean(raw), theme: load().theme });
}
