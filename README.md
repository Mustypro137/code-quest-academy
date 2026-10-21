# CodeQuest Academy

A free learning site for Python, automation, AI, projects and technical English. Plain HTML, CSS and
JavaScript, with no backend and no paid services. Python runs inside your browser with
[Pyodide](https://pyodide.org), so you can run real code, do exercises and get instant feedback.

**Try it: https://mustypro137.github.io/code-quest-academy/**

I built it to learn by small steps: read a short lesson, run an example, solve an exercise, answer a quiz.

## What you can learn

| Module | Lessons | Topics |
|---|---|---|
| Python Basics | 14 | Beginner to advanced: variables, loops, functions, dictionaries, errors, classes, generators, decorators |
| Python Automation | 12 | Files, CSV, JSON, dates, cleaning data, reports, a customer list cleaner project, merging CSVs, duplicate files, email, web data, Excel |
| AI with Python | 6 | Prompts, messages, a fake model for testing, JSON replies, calling a real model, a message sorter project |
| Projects & Portfolio | 6 | Choosing a project, structure, tests, error handling, Git and GitHub, building a portfolio |
| LinkedIn & Communication | 4 | Profile, simple writing, posting about a project, writing a README |
| Typing & Technical English | 7 | Typing drills with WPM and accuracy, reading errors, programming words, explaining code, asking for help |

## Features
- **Runnable examples and exercises.** Edit code, press Run (or Ctrl+Enter). Exercises have tests, hints, and a
  solution that unlocks after 2 failed tries. Code that runs longer than 10 seconds is stopped.
- **Progress.** XP, a daily streak, solved exercises and best quiz scores, saved in your browser.
- **Backup.** Download your progress from the home page and restore it later or on another device.
- **Works offline.** No server code and no outside services. Pyodide is included in the repository, and a service
  worker caches the site, so after one visit it opens without internet. You can install it as an app from the
  browser menu.
- **Typing trainer.** Drills show each letter as right or wrong while you type, then your WPM and accuracy. Your
  best speed is saved.
- **Accessible.** Light and dark themes, keyboard support, large touch targets on phones. Pages were checked
  with axe-core.
- **Real-PC lessons.** Code that cannot run in a browser (files, email, API calls, Git) is shown with a Copy
  button, so you can run it on your own computer.

| Action | XP |
|---|---|
| Complete a lesson (first time) | 10 |
| Solve an exercise (first time) | 15 |
| Quiz: each point above your best score | 2 |

## Run it on your computer
The site needs a small local server, because browsers block Python and `fetch` on `file://` pages.

```
python -m http.server 8000
```

Open http://localhost:8000. Or use the VS Code "Live Server" extension.

## Folder map
```
index.html          app shell
sw.js, manifest.webmanifest, icons/   offline support and install
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
A lesson is one JSON file, and no JavaScript changes are needed. See [docs/adding-lessons.md](docs/adding-lessons.md).

## Known limits
- `input()` does not work in the browser runner (it reports end of file).
- Only the Python standard library is available. Packages such as numpy are not included yet.
- Email, web and Excel lessons show code to copy to your own PC. They cannot run in the browser.
- Progress lives in one browser. Use Backup to move it to another.
- The real-model lesson (AI with Python, lesson 5) needs an account and an API key, and it was not run during
  development. Check the current model name in the provider's documentation.

## License
MIT. See [LICENSE](LICENSE).

## Credits
Python in the browser by [Pyodide](https://pyodide.org) (Mozilla Public License 2.0). The version and source are in
[vendor/pyodide/README.md](vendor/pyodide/README.md).
