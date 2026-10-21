# How to add a lesson

A lesson is one JSON file. You do not need to change any JavaScript.

## 1. Create the file
Put it in `content/<module-id>/<lesson-id>.json`. IDs use letters, numbers and `-` only.

## 2. Add it to the index
Add one entry to the module in `content/index.json`. Lessons show in the order you list them.

```json
{ "id": "08-files", "title": "Reading files", "level": "intermediate" }
```

`level` is `beginner`, `intermediate` or `advanced`. If you leave it out, it counts as beginner.
A module with an empty `lessons` list shows as "Coming soon".

## 3. Write the lesson
Everything except `title` and `explanation` is optional.

```json
{
  "title": "Variables: give a value a name",

  "explanation": [
    { "type": "text", "text": "Use `=` to make a variable." },
    { "type": "code", "code": "age = 12\nprint(age)" },
    { "type": "tip",  "text": "Names cannot have spaces." }
  ],

  "examples": [
    { "title": "Change a variable", "code": "city = \"Paris\"\nprint(city)" },
    { "title": "Needs a real file", "run": false, "code": "open('data.txt')" }
  ],

  "exercises": [ ... ],

  "quiz": [
    {
      "question": "Which line makes a variable?",
      "options": ["age == 12", "12 = age", "age = 12"],
      "answer": 2,
      "explanation": "The name goes on the left of `=`."
    }
  ]
}
```

- Text supports `backticks` for inline code. All other HTML is shown as plain text.
- Code that cannot run in the browser (real files, email, the web) goes in a **PC block**. It shows the code
  with a Copy button and no Run button:
  `{ "type": "pc", "title": "rename files safely", "text": "What it does...", "code": "..." }`
  Put a safe default in the script, such as `DRY_RUN = True`, and tell the learner to use copies of their files.
- Other text blocks for `explanation`:
  - `{ "type": "list", "items": ["first point", "second point"] }` is a bullet list.
  - `{ "type": "template", "title": "About section", "text": "How to use it", "code": "..." }` is text the
    learner can copy and fill in, such as a post or a README. It has a Copy button and long lines wrap.
- `{ "type": "typing", "title": "Home row", "text": "asdf jkl;" }` is a typing drill. The learner types the text,
  and sees WPM and accuracy. A try is saved as a best only at 95% accuracy or more. Use `
` for a new line.
  Drills are numbered in the order they appear in the lesson. They give no XP.
- `**double stars**` make bold text. `` `backticks` `` make inline code. Use backticks around anything with `**`
  in it, such as `2 ** 3`, so it is never read as bold.
- Writing lessons (no code) can leave out `exercises`. Use examples with `"run": false, "wrap": true` to show
  sample text such as a weak and a better headline. They are shown as plain wrapped text, with no editor.
- If none of a module's lessons has a `level`, the module page shows one plain list with no level headings.
- Each run gets its own empty practice folder. Exercises can create files with `open()` or `pathlib`, and
  the tests can read them, but nothing is kept after the run.
- An example can have `"input": "Ada"` for the Input box. The box shows by itself when the code has `input(`.
- Examples are runnable and editable by default. Use `"run": false` for code that cannot run in the browser.
- `answer` is the position of the right option, counting from 0. Mix up the positions.
- Write for a beginner: short sentences, simple words.

## Exercises
In a `prompt`, a blank line starts a new paragraph, and text between two lines of three backticks
(a code fence) is shown as a code block. Use a fence to show sample output.

```json
{
  "prompt": "Write a function `double(n)` that returns `n` times 2.\n\nA blank line makes a new paragraph.",
  "starterCode": "def double(n):\n    pass\n",
  "tests": [
    { "call": "double(4)", "returns": "8" },
    { "call": "double(-3)", "returns": "-6" }
  ],
  "hints": ["Use `return`.", "The answer is `n * 2`."],
  "solution": "def double(n):\n    return n * 2"
}
```

There are two kinds of test:

| Test | Meaning |
|---|---|
| `{ "output": "Hello" }` | The program must print exactly this. Spaces at the end of lines and blank lines at the end are ignored. |
| `{ "contains": "Hello, Sam!" }` | The printed text must include this. Good for programs that use `input()`, where the exact output is awkward. |
| `{ "call": "double(4)", "returns": "8" }` | After the learner's code runs, Python evaluates `call`. The result must equal `returns`, which is a **Python literal written as text** (`"'Hi'"` for a string, `"[1, 2]"` for a list, `"None"`). |

Optional on a `call` test:
- `"setup"`: Python statements that run first, for example to make an object or use a decorator.
- `"label"`: a name used in the message, for example `"A new counter value"` gives
  "A new counter value should be 0, but it was 1".

A `call` can also be just a variable name, such as `"call": "total"`.

Rules that keep exercises fair:
- Start with `starterCode` that does **not** pass. Every exercise is checked this way.
- Keep the `solution` correct. It is shown after 2 failed tries.
- Programs can use `input()`. Give the exercise `"input": "line one\nline two"`, one line for each `input()` call. The learner sees these lines in an Input box. **Check always uses the original lines**, and Run uses what is in the box. The printed text includes each prompt and each answer, like a terminal.
- Tests are checked after the program runs once. They cannot change a variable and run it again.

## Check your work
1. Run the site and open the lesson.
2. Press Run on each example.
3. Press Check on each exercise with the starter code (it should fail), then with the solution (it should pass).
4. Play the quiz.

If a lesson will not open, look at the browser console (F12). Most problems are a missing comma in the JSON,
or a lesson `id` that does not match the file name.

## Offline support (service worker)
`sw.js` caches the site so it works offline. Lessons are found from `content/index.json`, so a new lesson needs
no change. But **a new file in `js/` or `css/` must be added to the `SHELL` list in `sw.js`**, or it will not work
offline the first time. Pages are loaded network-first, so changes show up when you are online.
