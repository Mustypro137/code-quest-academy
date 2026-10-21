# Curriculum schema

Status: **approved and in use** (modules 1 and 4 are written in it; the rest follow module by module).

Check any lesson with:

```
node tools/validate-lesson.mjs content/m04-functions/04-scope.json
```

The checker validates the shape, then runs every exercise, debug task and challenge with local Python 3:
**every starter must fail and every solution must pass.** It needs no packages. In the browser the same lessons are
tested with the page itself (starters fail, solutions pass, examples run, quizzes score perfectly).

## Where things live
```
content/curriculum.json                 the Python path: stages, modules, lessons, checkpoint flags
content/<module-id>/<lesson-id>.json    one lesson per file
content/<module-id>/checkpoint.json     the module checkpoint (a lesson-shaped file)
content/index.json                      the other modules (AI, Projects, LinkedIn, English)
js/moves.js                             old lesson ids -> new ids (keeps saved progress and old links working)
```

### curriculum.json
```json
{
  "stages": [
    {
      "id": "foundations", "title": "Foundations",
      "modules": [
        {
          "id": "m04-functions", "icon": "🧩", "title": "Functions", "summary": "Parameters, return values and scope.",
          "lessons": [ { "id": "01-defining-functions", "title": "Functions: reuse your code" } ],
          "checkpoint": true
        }
      ]
    }
  ]
}
```
The order of `lessons` is the order on the roadmap. `checkpoint: true` adds `checkpoint.json` as the last page of the
module. A module with no lessons yet shows as "Coming soon". A lesson unlocks when the one before it is done (soft
locks: a locked lesson can always be opened).

## Lesson file
Fields in **bold** are required. Fields a lesson already had (`explanation`, `examples`, `exercises`, `quiz`) work as
before, so older lessons can be upgraded one at a time.

| Field | What it holds |
|---|---|
| **`title`** | Lesson title. |
| **`objective`** | One sentence: what the learner can do afterwards. Starts with a verb. |
| **`kind`** | `"browser"` (everything runs in the page), `"pc"` (commands for your own computer; exercises use small Python functions that build or read the commands) or `"checkpoint"`. |
| **`prerequisites`** | List of lesson ids such as `"m04-functions/01-defining-functions"`. The lesson page links to them. Can be empty. |
| **`explanation`** | Blocks in simple English: `text`, `code`, `tip`, `list`, `pc`, `template`, `typing`. |
| **`walkthrough`** | List of `{ title, code, lines: [{ line, explain }] }`. Each important line of a code example gets one plain sentence. The checker makes sure every `line` really is in the `code`. |
| `examples` | Runnable examples, as before (`run: false` for text only; `input` for `input()` lines). |
| **`exercises`** | Exactly 3. Each has `level` (`easy`, `medium`, `hard`, in that order), `prompt`, `starterCode`, `tests`, **`hints`** (at least one; shown one by one before the solution unlocks), `solution`, and optional `input`. The solution must be a complete program. |
| **`debug`** | One or more debugging tasks: `{ title, symptom, prompt, brokenCode, tests, hints, solution, input? }`. `symptom` is the real error message or the wrong behaviour. The learner fixes the code. |
| **`mistakes`** | List of `{ mistake, why, fix }`. Shown as a "Common mistakes" box. |
| **`quiz`** | At least 3 questions: `question`, `options`, `answer`, `explanation`. |
| **`challenge`** | Practical mini-challenge: `{ title, prompt, starterCode, tests, hints, solution, stretch?, input? }`. `stretch` is an extra idea that is not tested. |
| **`review`** | One question from an **earlier** lesson: `{ from, question, options, answer, explanation }`. A wrong answer goes on the Revision list (saved under the lesson it is shown in). The very first lesson of the path has none. |

The exercises, debug tasks and the challenge appear in the practice panel in that order. Each counts as one exercise
for progress (+15 XP the first time it is solved).

### Tests
`{ "output": "text" }`, `{ "contains": "text" }`, `{ "call": "f(2)", "returns": "4", "setup": "...", "label": "..." }`.
See [adding-lessons.md](adding-lessons.md) for what each does.

### Module checkpoint (`checkpoint.json`)
A lesson-shaped file that is finished by passing its quiz:
```json
{
  "title": "Functions checkpoint",
  "objective": "...",
  "kind": "checkpoint",
  "passPercent": 70,
  "explanation": [ { "type": "text", "text": "What this checkpoint covers." } ],
  "quiz": [ { "from": "m04-functions/04-scope", "question": "...", "options": [], "answer": 0, "explanation": "..." } ],
  "exercises": [ { "level": "hard", "prompt": "...", "starterCode": "...", "tests": [], "hints": [], "solution": "..." } ]
}
```
About 8 questions: most from this module and some from earlier modules (each question says its lesson in `from`),
plus one combined challenge. Scoring `passPercent` or more completes the checkpoint.
