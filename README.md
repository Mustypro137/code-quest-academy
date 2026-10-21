# CodeQuest Academy

A personal learning site. Plain HTML, CSS and JavaScript. No backend, no paid services.
Python runs inside the browser with Pyodide, so lessons work offline once the files are on your computer.

## Run it
The site needs a small local server (browsers block Python and `fetch` on `file://` pages).

```
python -m http.server 8000
```

Open http://localhost:8000. Or use the VS Code "Live Server" extension.

## What is in it
- **Lessons** with explanations, runnable examples, exercises, hints and a quiz.
- **Python runner**: edit code, press Run (or Ctrl+Enter). Code that runs longer than 10 seconds is stopped.
- **Exercises** with tests, hints, and a solution that unlocks after 2 failed tries.
- **Progress**: XP, daily streak, solved exercises and quiz best scores. It is saved in your browser.
- **Backup**: download your progress from the home page, and restore it later. Do this now and then,
  because clearing browser data erases your progress.

| Action | XP |
|---|---|
| Complete a lesson (first time) | 10 |
| Solve an exercise (first time) | 15 |
| Quiz: each point above your best score | 2 |

## Folder map
```
index.html          app shell
css/                base.css (colours, themes), components.css (everything else)
js/
  app.js            router and start-up
  store.js          the only file that uses localStorage (progress, XP, streak, backup)
  content.js        loads lesson files
  python/           worker.js (runs Python), runner.js (talks to the worker)
  ui/               home, lesson, quiz, exercise, codebox, backup
content/
  index.json        list of modules and lessons
  <module>/<lesson>.json
vendor/pyodide/     Python for the browser (version in its README)
docs/               adding-lessons.md
```

## Add content
See [docs/adding-lessons.md](docs/adding-lessons.md).

## Known limits
- `input()` does not work in the browser runner (it reports end of file).
- Only the Python standard library is available. Packages such as numpy are not included yet.
- Progress lives in one browser. Use Backup to move it to another.
