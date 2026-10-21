// The only module that touches localStorage.
//
// Saved shape (all fields optional when loading):
//   theme      "light" | "dark" | "system"   (no value means dark)
//   settings   { reduceMotion: bool, unlockAll: bool }
//   completed  { "<moduleId>/<lessonId>": "YYYY-MM-DD" }  (date first completed)
//   xp         whole number
//   streak     days in a row, as of lastActive
//   bestStreak the longest streak so far
//   quiz       { "<moduleId>/<lessonId>": { best, total } }  (best score so far)
//   exercises  { "<moduleId>/<lessonId>/<number>": "YYYY-MM-DD" }  (date first solved)
//   typing     { "<moduleId>/<lessonId>/<number>": best words per minute }  (saved at 95%+ accuracy)
//   activity   { "YYYY-MM-DD": number of things done that day }  (last 400 days)
//   achievements { "<id>": "YYYY-MM-DD" }  (date unlocked)
//   lastActive "YYYY-MM-DD" (local date)
//   lastExport "YYYY-MM-DD"
//
// After every change to progress the page gets a "cqa:progress" event with { xpBefore, xpAfter }.
const KEY = 'cqa.progress';
const APP = 'codequest-academy';
export const LESSON_XP = 10;
export const QUIZ_XP = 2; // per point of improvement over your best score
export const EXERCISE_XP = 15;
export const MIN_TYPING_ACCURACY = 95; // a typing try is only saved as a best at this accuracy or more
const ACTIVITY_DAYS = 400;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LESSON_KEY = /^[\w-]+\/[\w-]+$/;
const EXERCISE_KEY = /^[\w-]+\/[\w-]+\/\d+$/;
const ID = /^[a-z0-9-]+$/;

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysBetween(a, b) {
  const t = (s) => Date.UTC(...s.split('-').map((n, i) => (i === 1 ? n - 1 : +n)));
  return Math.round((t(b) - t(a)) / 86400000);
}

// Keeps the entries of a { key: value } object whose key and value pass the tests.
function pick(obj, keyOk, valueOk) {
  const out = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) if (keyOk(k) && valueOk(v)) out[k] = v;
  }
  return out;
}

// Builds a well-formed object from anything. Bad fields fall back to defaults.
function clean(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const whole = (n) => (Number.isSafeInteger(n) && n >= 0 ? n : 0);
  const date = (s) => (typeof s === 'string' && DATE.test(s) ? s : undefined);
  const isDate = (v) => typeof v === 'string' && DATE.test(v);
  const quiz = {};
  if (r.quiz && typeof r.quiz === 'object') {
    for (const [k, v] of Object.entries(r.quiz)) {
      if (LESSON_KEY.test(k) && v && whole(v.total) > 0 && whole(v.best) <= v.total) {
        quiz[k] = { best: whole(v.best), total: v.total };
      }
    }
  }
  const s = r.settings && typeof r.settings === 'object' ? r.settings : {};
  return {
    theme: ['light', 'dark', 'system'].includes(r.theme) ? r.theme : undefined,
    settings: { reduceMotion: s.reduceMotion === true, unlockAll: s.unlockAll === true },
    completed: pick(r.completed, (k) => LESSON_KEY.test(k), isDate),
    quiz,
    exercises: pick(r.exercises, (k) => EXERCISE_KEY.test(k), isDate),
    typing: pick(r.typing, (k) => EXERCISE_KEY.test(k), (v) => typeof v === 'number' && v > 0 && v <= 500),
    activity: pick(r.activity, (k) => DATE.test(k), (v) => Number.isSafeInteger(v) && v > 0 && v < 100000),
    achievements: pick(r.achievements, (k) => ID.test(k), isDate),
    xp: whole(r.xp),
    streak: whole(r.streak),
    bestStreak: whole(r.bestStreak),
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

// Saves a change to progress and tells the page, so it can show XP, level-ups and achievements.
function commit(data, xpBefore) {
  save(data);
  window.dispatchEvent(new CustomEvent('cqa:progress', { detail: { xpBefore, xpAfter: data.xp } }));
}

export function getTheme() {
  return load().theme;
}

export function setTheme(theme) {
  save({ ...load(), theme });
}

export function getSettings() {
  return load().settings;
}

export function setSetting(name, value) {
  const data = load();
  if (name in data.settings) data.settings[name] = value === true;
  save(data);
}

export function isDone(moduleId, lessonId) {
  return `${moduleId}/${lessonId}` in load().completed;
}

export function doneCount(moduleId) {
  return Object.keys(load().completed).filter((k) => k.startsWith(`${moduleId}/`)).length;
}

// Counts today as an active day (updates the streak and the activity log). Call before save().
function touchStreak(data) {
  const now = today();
  data.activity[now] = (data.activity[now] ?? 0) + 1;
  const days = Object.keys(data.activity).sort();
  for (const d of days.slice(0, Math.max(0, days.length - ACTIVITY_DAYS))) delete data.activity[d];
  if (data.lastActive !== now) {
    data.streak = data.lastActive && daysBetween(data.lastActive, now) === 1 ? data.streak + 1 : 1;
    data.lastActive = now;
  }
  data.bestStreak = Math.max(data.bestStreak, data.streak);
}

// Marks a lesson done. XP is given only the first time. Returns the XP gained.
export function completeLesson(moduleId, lessonId) {
  const data = load();
  const key = `${moduleId}/${lessonId}`;
  if (key in data.completed) return 0;

  const before = data.xp;
  data.completed[key] = today();
  data.xp += LESSON_XP;
  touchStreak(data);
  commit(data, before);
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

  const before = data.xp;
  data.exercises[key] = today();
  data.xp += EXERCISE_XP;
  touchStreak(data);
  commit(data, before);
  return EXERCISE_XP;
}

// Best typing speed (WPM) for a drill, or undefined if none was saved.
export function getTypingBest(moduleId, lessonId, number) {
  return load().typing[`${moduleId}/${lessonId}/${number}`];
}

// Saves a finished typing try if its accuracy is high enough and it beats the best.
// No XP: it only counts as activity for the streak. Returns { isNewBest }.
export function recordTyping(moduleId, lessonId, number, wpm, accuracy) {
  const data = load();
  const key = `${moduleId}/${lessonId}/${number}`;
  touchStreak(data);
  const isNewBest = accuracy >= MIN_TYPING_ACCURACY && wpm > 0 && wpm <= 500 && wpm > (data.typing[key] ?? 0);
  if (isNewBest) data.typing[key] = wpm;
  commit(data, data.xp);
  return { isNewBest };
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
  const before = data.xp;
  touchStreak(data);
  const gained = Math.max(0, score - prevBest) * QUIZ_XP;
  if (!prev || prev.total !== total || score > prevBest) data.quiz[key] = { best: score, total };
  data.xp += gained;
  commit(data, before);
  return gained;
}

// Level N starts at 50 * N * (N - 1) XP: 0, 100, 300, 600, 1000, ...
export function levelInfo(xp) {
  let level = 1;
  while (50 * (level + 1) * level <= xp) level++;
  const start = 50 * level * (level - 1);
  const next = 50 * (level + 1) * level;
  return { level, start, next, into: xp - start, span: next - start, percent: Math.round(((xp - start) / (next - start)) * 100) };
}

export function getStats() {
  const d = load();
  // A streak is alive if you were active today or yesterday.
  const alive = d.lastActive && daysBetween(d.lastActive, today()) <= 1;
  return {
    xp: d.xp,
    streak: alive ? d.streak : 0,
    bestStreak: d.bestStreak,
    lessonsDone: Object.keys(d.completed).length,
    exercisesSolved: Object.keys(d.exercises).length,
    quizzesPerfect: Object.values(d.quiz).filter((q) => q.best === q.total).length,
    bestTypingWpm: Math.max(0, ...Object.values(d.typing)),
    lastExport: d.lastExport,
  };
}

// { "YYYY-MM-DD": count } for the days you were active.
export function getActivity() {
  return load().activity;
}

export function getAchievements() {
  return load().achievements;
}

// Remembers when achievements were unlocked. Returns the ids that were new.
export function recordAchievements(ids) {
  const data = load();
  const fresh = ids.filter((id) => ID.test(id) && !(id in data.achievements));
  if (!fresh.length) return [];
  for (const id of fresh) data.achievements[id] = today();
  save(data);
  return fresh;
}

// Returns the backup file text and remembers the backup date.
export function exportProgress() {
  const data = { ...load(), lastExport: today() };
  save(data);
  return JSON.stringify({ app: APP, version: 1, ...data }, null, 2);
}

// Replaces all progress with a backup file. Keeps this device's theme and settings.
// Throws an Error with a simple message if the file is not a valid backup.
export function importProgress(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!raw || raw.app !== APP) throw new Error('That file is not a CodeQuest Academy backup.');
  const mine = load();
  save({ ...clean(raw), theme: mine.theme, settings: mine.settings });
}

// Erases all progress. Keeps this device's theme and settings.
export function resetProgress() {
  const mine = load();
  save({ ...clean(null), theme: mine.theme, settings: mine.settings });
  window.dispatchEvent(new CustomEvent('cqa:progress', { detail: { xpBefore: mine.xp, xpAfter: 0 } }));
}
