# CodeQuest Academy

A free learning site for Python, automation, AI, projects and technical English. Plain HTML, CSS and
JavaScript, with no backend and no paid services. Python runs inside your browser with
[Pyodide](https://pyodide.org), so you can run real code, do exercises and get instant feedback.

**Try it: https://mustypro137.github.io/code-quest-academy/**

I built it to learn by small steps: read a short lesson, run an example, solve an exercise, answer a quiz.

## What you can learn

| Module | Lessons | Topics |
|---|---|---|
| Python Basics | 22 | Beginner to advanced: variables, loops, `input()`, functions, dictionaries, errors, tuples and sets, sorting, modules, regular expressions, classes, generators, decorators, recursion, dataclasses, the `with` statement |
| Python Automation | 12 | Files, CSV, JSON, dates, cleaning data, reports, a customer list cleaner project, merging CSVs, duplicate files, email, web data, Excel |
| AI with Python | 6 | Prompts, messages, a fake model for testing, JSON replies, calling a real model, a message sorter project |
| Projects & Portfolio | 6 | Choosing a project, structure, tests, error handling, Git and GitHub, building a portfolio |
| LinkedIn & Communication | 4 | Profile, simple writing, posting about a project, writing a README |
| Typing & Technical English | 7 | Typing drills with WPM and accuracy, reading errors, programming words, explaining code, asking for help |

## Features
- **Runnable examples and exercises.** Edit code, press Run (or Ctrl+Enter). Exercises have tests, hints, and a
  solution that unlocks after 2 failed tries. Code that runs longer than 10 seconds is stopped.
- **Dashboard, roadmap and progress.** A "continue" card, a level ring (level N starts at 50 x N x (N-1) XP), a
  learning path with done, up-next and locked lessons (locks are only a suggestion), an active-days calendar and
  15 achievements.
- **Progress.** XP, a daily streak, solved exercises and best quiz scores, saved in your browser.
- **Practice rooms.** A challenge arena (3 timed exercises, no hints, small daily XP bonus), a revision centre (missed
  quiz questions and flashcards that come back after 1, 3 and 7 days), a project workshop (step checklists for two
  projects and a plan of your own) and a LinkedIn practice room (drafts and checklists that stay on your device).
- **Settings.** Dark, light or system theme, reduce motion, "Unlock everything", backup and restore, offline
  status, and reset with a confirmation.
- **Backup.** Download your progress from the home page and restore it later or on another device.
- **Works offline.** No server code and no outside services. Pyodide is included in the repository, and a service
  worker caches the site, so after one visit it opens without internet. You can install it as an app from the
  browser menu.
- **Typing trainer.** Drills show each letter as right or wrong while you type, then your WPM and accuracy. Your
  best speed is saved.
- **Accessible.** Dark navy design with a light option, keyboard support, large touch targets, reduced-motion
  support. Pages were checked with axe-core on desktop, tablet and phone in both themes.
- **Real-PC lessons.** Code that cannot run in a browser (files, email, API calls, Git) is shown with a Copy
  button, so you can run it on your own computer.

| Action | XP |
|---|---|
| Complete a lesson (first time) | 10 |
| Solve an exercise (first time) | 15 |
| Quiz: each point above your best score | 2 |
| Challenge arena: each exercise solved, once a day | 5 |
| Challenge arena: all exercises solved, once a day | +10 |

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
css/                base.css (design tokens, themes, app shell), components.css (lesson parts), screens.css (screens)
js/
  app.js            router and start-up
  store.js          the only file that uses localStorage (progress, XP, streak, backup)
  content.js        loads lesson files
  python/           worker.js (runs Python), runner.js (talks to the worker)
  path.js           lesson states (done, current, locked); achievements.js, appearance.js
  ui/               dashboard, roadmap, progress, settings, rewards, practice rooms (challenge, revise, workshop,
                    writing), lesson, quiz, exercise, codebox, typing, backup
content/
  index.json        list of modules and lessons
  <module>/<lesson>.json
  glossary.json, workshop.json, writing.json   flashcards, project checklists, writing room drafts
vendor/pyodide/     Python for the browser (version in its README)
docs/               adding-lessons.md
```

## Add content
A lesson is one JSON file, and no JavaScript changes are needed. See [docs/adding-lessons.md](docs/adding-lessons.md).

## Known limits
- `input()` does not wait for the keyboard in the browser. Type its answers in the Input box under the code, one line for each `input()`. `sys.stdin` is empty.
- Only the Python standard library is available. Packages such as numpy are not included yet.
- Email, web and Excel lessons show code to copy to your own PC. They cannot run in the browser.
- Progress lives in one browser. Use Backup to move it to another.
- The real-model lesson (AI with Python, lesson 5) needs an account and an API key, and it was not run during
  development. Check the current model name in the provider's documentation.

## Contact
Built by Mustapha Abdullahi. Email: [mustypro137@gmail.com](mailto:mustypro137@gmail.com)

## License
MIT. See [LICENSE](LICENSE).

## Credits
Python in the browser by [Pyodide](https://pyodide.org) (Mozilla Public License 2.0). The version and source are in
[vendor/pyodide/README.md](vendor/pyodide/README.md).
