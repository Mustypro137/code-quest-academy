// Checks a curriculum lesson file (see docs/curriculum-schema.md) with local Python 3.
//   node tools/validate-lesson.mjs content/_samples/04-functions-scope.json [more files...]
// It checks the shape of the lesson, then runs every exercise, debug task and challenge:
// the starter must FAIL at least one test, and the solution must pass them all.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNNER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'run_tests.py');
const LEVELS = ['easy', 'medium', 'hard'];
const problems = [];
const fail = (file, msg) => problems.push(`${path.basename(file)}: ${msg}`);

function runPython(code, tests, input) {
  const r = spawnSync('python', ['-I', RUNNER], { input: JSON.stringify({ code, tests, input }), encoding: 'utf8', timeout: 30000 });
  if (r.status !== 0) return { error: `runner crashed: ${r.stderr.slice(0, 300)}`, results: [] };
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

// A task has a start (starterCode or brokenCode), tests, hints, and a solution.
function checkTask(file, label, task, startKey) {
  const start = task[startKey];
  if (typeof start !== 'string' || !task.solution || !Array.isArray(task.tests) || !task.tests.length) return fail(file, `${label}: needs ${startKey}, tests and solution`);
  if (!Array.isArray(task.hints) || !task.hints.length) fail(file, `${label}: needs at least one hint before the solution`);
  const before = runPython(start, task.tests, task.input);
  const startPasses = !before.error && before.results.length && before.results.every((t) => t.pass);
  if (startPasses) fail(file, `${label}: the starting code already passes every test`);
  const after = runPython(task.solution, task.tests, task.input);
  if (after.error) fail(file, `${label}: the solution crashed: ${after.error}`);
  else for (const t of after.results) if (!t.pass) fail(file, `${label}: the solution fails: ${t.message}`);
}

function checkQuestion(file, label, qn) {
  if (!qn?.question || !Array.isArray(qn.options) || qn.options.length < 2 || !qn.explanation) return fail(file, `${label}: needs question, options and explanation`);
  if (!Number.isInteger(qn.answer) || qn.answer < 0 || qn.answer >= qn.options.length) fail(file, `${label}: answer is not a valid option number`);
}

for (const file of process.argv.slice(2)) {
  let lesson;
  try { lesson = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { fail(file, 'not valid JSON: ' + e.message); continue; }
  for (const key of ['title', 'objective']) if (typeof lesson[key] !== 'string' || !lesson[key]) fail(file, `missing ${key}`);
  if (lesson.kind === 'checkpoint') {
    // A checkpoint: a quiz with a pass mark (each question says which lesson it is from) and a combined challenge.
    if (!(lesson.passPercent > 0 && lesson.passPercent <= 100)) fail(file, 'checkpoint needs passPercent');
    if (!Array.isArray(lesson.quiz) || lesson.quiz.length < 6) fail(file, 'checkpoint needs at least 6 quiz questions');
    (lesson.quiz ?? []).forEach((qn, i) => { checkQuestion(file, `quiz ${i + 1}`, qn); if (!qn.from) fail(file, `quiz ${i + 1}: needs "from" (the lesson it comes from)`); });
    if (!Array.isArray(lesson.exercises) || !lesson.exercises.length) fail(file, 'checkpoint needs a combined challenge in exercises');
    (lesson.exercises ?? []).forEach((e, i) => checkTask(file, `challenge ${i + 1}`, e, 'starterCode'));
    console.log(`checked ${path.basename(file)}: checkpoint with ${(lesson.quiz ?? []).length} questions and ${(lesson.exercises ?? []).length} challenge`);
    continue;
  }
  if (!['browser', 'pc'].includes(lesson.kind)) fail(file, 'kind must be "browser" or "pc"');
  if (!Array.isArray(lesson.prerequisites)) fail(file, 'prerequisites must be a list (it can be empty)');
  if (!Array.isArray(lesson.explanation) || !lesson.explanation.length) fail(file, 'missing explanation');
  if (!Array.isArray(lesson.walkthrough) || !lesson.walkthrough.length) fail(file, 'missing walkthrough (code with line-by-line notes)');
  for (const [i, w] of (lesson.walkthrough ?? []).entries()) {
    if (!w.code || !Array.isArray(w.lines) || !w.lines.length) { fail(file, `walkthrough ${i + 1}: needs code and lines`); continue; }
    for (const l of w.lines) {
      if (!l.line || !l.explain) fail(file, `walkthrough ${i + 1}: every line needs "line" and "explain"`);
      else if (!w.code.includes(l.line)) fail(file, `walkthrough ${i + 1}: line not found in the code: ${l.line}`);
    }
  }
  const ex = lesson.exercises ?? [];
  if (ex.length !== 3) fail(file, 'needs exactly 3 exercises');
  ex.forEach((e, i) => { if (e.level !== LEVELS[i]) fail(file, `exercise ${i + 1}: level must be "${LEVELS[i]}"`); });
  ex.forEach((e, i) => checkTask(file, `exercise ${i + 1}`, e, 'starterCode'));
  if (!Array.isArray(lesson.debug) || !lesson.debug.length) fail(file, 'needs at least one debugging task');
  (lesson.debug ?? []).forEach((d, i) => { if (!d.symptom) fail(file, `debug ${i + 1}: needs a symptom`); checkTask(file, `debug ${i + 1}`, d, 'brokenCode'); });
  if (!Array.isArray(lesson.mistakes) || !lesson.mistakes.length) fail(file, 'needs common mistakes');
  (lesson.mistakes ?? []).forEach((m, i) => { if (!m.mistake || !m.why || !m.fix) fail(file, `mistake ${i + 1}: needs mistake, why and fix`); });
  if (!Array.isArray(lesson.quiz) || lesson.quiz.length < 3) fail(file, 'needs a quiz of at least 3 questions');
  (lesson.quiz ?? []).forEach((qn, i) => checkQuestion(file, `quiz ${i + 1}`, qn));
  if (!lesson.challenge) fail(file, 'needs a mini-challenge');
  else { if (!lesson.challenge.title) fail(file, 'challenge needs a title'); checkTask(file, 'challenge', lesson.challenge, 'starterCode'); }
  // The very first lesson of the path has no earlier lesson to review.
  if (!lesson.review) { if (path.basename(file) !== '01-how-programs-run.json') fail(file, 'needs a review question from an earlier lesson'); }
  else if (!lesson.review.from) fail(file, 'review needs "from" (an earlier lesson)');
  else checkQuestion(file, 'review', lesson.review);
  console.log(`checked ${path.basename(file)}: ${ex.length} exercises, ${(lesson.debug ?? []).length} debug tasks, challenge, ${(lesson.quiz ?? []).length} quiz questions, review`);
}
if (problems.length) {
  console.log('\nPROBLEMS:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('all lessons are valid: every starter fails and every solution passes');
