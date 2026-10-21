# Curriculum schema (proposal)

Status: **proposed, waiting for approval.** Two sample lessons follow this schema:
`content/_samples/04-functions-scope.json` (runs in the browser) and
`content/_samples/05-modules-venv.json` (for your own PC). Check any lesson with:

```
node tools/validate-lesson.mjs content/_samples/04-functions-scope.json
```

The checker validates the shape, then runs every exercise, debug task and challenge with local Python:
**every starter must fail and every solution must pass.** It needs no packages.

## Where lessons live
```
content/curriculum.json            the path: stages, modules, lesson ids, checkpoints
content/<module-id>/<lesson-id>.json   one lesson per file (same place as today)
content/<module-id>/checkpoint.json    the module checkpoint
```

## curriculum.json
```json
{
  "stages": [
    {
      "id": "foundations", "title": "Foundations",
      "modules": [
        {
          "id": "m04-functions", "title": "Functions", "summary": "Reuse code with functions.",
          "lessons": ["01-defining", "02-parameters", "03-returning", "04-scope", "05-design"],
          "checkpoint": "checkpoint"
        }
      ]
    }
  ]
}
```
The order of `lessons` is the order on the roadmap. A lesson unlocks when the one before it is done (soft locks,
as today). A module checkpoint unlocks when its lessons are done.

## Lesson file
Fields in **bold** are required. Every field a lesson already has today (`explanation`, `examples`, `exercises`,
`quiz`) keeps working, so the 57 existing lessons can be moved over one at a time.

| Field | What it holds |
|---|---|
| **`title`** | Lesson title. |
| **`objective`** | One sentence: what the learner can do afterwards. Starts with a verb. |
| **`kind`** | `"browser"` (everything runs in the page) or `"pc"` (commands for your own computer; exercises use small Python functions that build or read the commands). |
| **`prerequisites`** | List of lesson ids such as `"python-basics/int-01-functions"`. The lesson page links to them. Can be empty. |
| **`explanation`** | Blocks in simple English: `text`, `code`, `tip`, `list`, `pc`, `template` (as today). |
| **`walkthrough`** | List of `{ title, code, lines: [{ line, explain }] }`. Each important line of a code example gets one plain sentence. The checker makes sure every `line` really is in the `code`. |
| `examples` | Runnable examples, as today. |
| **`exercises`** | Exactly 3. Each has `level` (`easy`, `medium`, `hard`, in that order), `prompt`, `starterCode`, `tests`, **`hints`** (at least one; shown one by one before the solution unlocks), `solution`. |
| **`debug`** | One or more debugging tasks: `{ title, symptom, prompt, brokenCode, tests, hints, solution }`. `symptom` is the real error message or wrong behaviour. The learner fixes the code. |
| **`mistakes`** | List of `{ mistake, why, fix }`. Shown as a "Common mistakes" box. |
| **`quiz`** | At least 3 questions, as today (`question`, `options`, `answer`, `explanation`). |
| **`challenge`** | Practical mini-challenge: `{ title, prompt, starterCode, tests, hints, solution, stretch? }`. `stretch` is an extra idea that is not tested. |
| **`review`** | One question from an **earlier** lesson: `{ from, question, options, answer, explanation }`. A wrong answer goes on the Revision list of the lesson in `from`. |

### Tests (unchanged)
`{ "output": "text" }`, `{ "contains": "text" }`, `{ "call": "f(2)", "returns": "4", "setup": "...", "label": "..." }`.
An exercise or challenge can also have `"input": "line one\nline two"` for `input()`.

### Module checkpoint (`checkpoint.json`)
```json
{
  "title": "Functions checkpoint",
  "passPercent": 70,
  "quiz": [ { "from": "m04-functions/04-scope", "question": "...", "options": [], "answer": 0, "explanation": "..." } ],
  "challenge": { "title": "...", "prompt": "...", "starterCode": "...", "tests": [], "hints": [], "solution": "..." }
}
```
About 8 questions: 5 from this module and 3 from earlier modules, plus one combined coding challenge.

## What the app must learn to draw (not built yet)
The current page ignores unknown fields, so nothing breaks. To show the new fields I would add:
a lesson header (objective, prerequisites, kind badge); the walkthrough as a table of line and note; level labels
on exercises; a "Debug it" section; a "Common mistakes" box; a "Challenge" section with an optional stretch note;
the review question at the end; and a checkpoint page with a pass mark. All reuse the code box, quiz and
exercise components that exist today.
