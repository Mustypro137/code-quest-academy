# Python path: structure (proposal)

Status: **approved.** Decisions: a new "Python path" track with the existing lessons moved into it (the AI,
Projects, LinkedIn and English modules stay as they are), `sqlite3` and `pytest` added to the saved browser Python,
and the schema in [curriculum-schema.md](curriculum-schema.md).

## Build status
Done means every lesson uses the full schema, the checkpoint exists, and the browser tests and accessibility
scans pass. "Moved" lessons are in their new place and still work, but have not been upgraded to the full schema yet.

| Module | Status |
|---|---|
| 1 Fundamentals | **Done** (6 lessons and a checkpoint) |
| 4 Functions | **Done** (5 lessons and a checkpoint) |
| 2, 3, 5, 6, 7, 8, 9, 10, 13, 16, 18 | Some lessons moved in, to be upgraded and completed in order |
| 11, 12, 14, 15, 17 | Not started (all new) |

The path is built one module at a time, so the roadmap shows the unfinished modules as "Coming soon" or with the
lessons that exist so far.

## What can run in the page
I tested the browser Python (Pyodide 0.29.5) that the site already uses.

| Works now | Can be added (small package files saved in the repo) | Never in the page |
|---|---|---|
| asyncio (even top-level `await`), unittest, doctest, typing, dataclasses, pathlib, os, shutil, tempfile, zipfile, json, csv, logging, argparse, timeit, hashlib, secrets, enum, abc, functools, itertools, contextlib, statistics, decimal, fractions, configparser, tomllib | **sqlite3** and **pytest** (both are in the Pyodide package list, and I would save the files for offline use). | Real web requests (the site runs offline, and browsers block most sites anyway), `venv`, `pip`, real threads and processes, Git and shell commands, `ssl`, packaging and deployment tools. |

So every lesson is one of two kinds. **`browser`** lessons run all code in the page. **`pc`** lessons give
copy-and-run commands for your own computer, and their exercises test small Python functions that *build or read*
those commands (see the venv sample). Network code is taught with a **fake** `get` function that tests can pass in,
like the fake AI model in the AI module, and the real call is a PC block.

## The path: 6 stages, 18 modules, about 90 lessons
"Have" means material that already exists and would be moved into the new schema and extended.

| Stage | # | Module (your topic) | Lessons | Kind | What exists today |
|---|---|---|---|---|---|
| **1 Foundations** | 1 | Programming fundamentals (1) | 6: how a program runs, variables and types, numbers and operators, text and f-strings, input and output, reading error messages | browser | have 4 (print, variables, numbers, input) |
| | 2 | Conditions, loops, logic (2) | 5: booleans and comparisons, if/elif/else, while, for and range, thinking in steps (nesting, break, tracing) | browser | have 2 (conditions, loops) |
| | 3 | Collections (3) | 6: strings in depth, lists, tuples, sets, dictionaries, choosing a data structure | browser | have 5 (strings, lists, dictionaries, tuples and sets, sorting) |
| | 4 | Functions (4) | 5: defining, parameters (defaults, keywords, `*args`), return values, **scope**, small functions and docstrings | browser | have 1; scope is the sample |
| **2 Working tools** | 5 | Modules, packages, environments (5) | 5: import, tour of the standard library, packages, **virtual environments and pip**, dependency habits | mixed | have 1 (modules); venv is the sample |
| | 6 | Errors, debugging, testing basics (6) | 6: reading tracebacks, try/except/else/finally, raising and custom exceptions, debugging method (print, pdb, logging), assert, unittest and doctest | browser | have 2 (errors, testing) |
| | 7 | Reading and writing files (7) | 5: text files, JSON, CSV, other formats (configparser, tomllib, zip), encodings and safe writing | browser | have 3 (files, CSV, JSON) |
| | 8 | Paths and folders (8) | 4: pathlib, os, shutil, finding and moving files safely (dry run) | browser | have part of 1 |
| **3 Pythonic code** | 9 | Comprehensions to decorators (9) | 5: comprehensions, iterators, itertools, generators, closures and decorators | browser | have 3 (comprehensions, generators, decorators) |
| | 10 | Object-oriented programming (10) | 5: classes, methods and special methods, inheritance and composition, dataclasses, enums and properties | browser | have 2 (classes, dataclasses) |
| | 11 | Types and clean code (11) | 4: type hints, readable code (names, small functions), refactoring, maintainability (formatting and linting tools on your PC) | mixed | none |
| **4 Professional skills** | 12 | Git, command line, structure (12) | 5: command line basics, Git basics, GitHub and branches, a command-line tool with argparse, project structure | mixed | have 1 (Git and GitHub) |
| | 13 | HTTP and APIs (13) | 5: how HTTP works, requests on your PC, reading JSON APIs, environment variables and secrets, errors, retries and rate limits | mixed | have 1 (web data) and part of the AI module |
| | 14 | SQLite and SQL (14) | 6: tables and SELECT, INSERT/UPDATE/DELETE, WHERE/ORDER/aggregates, JOIN, Python `sqlite3` with parameters, designing a small schema | browser (after adding sqlite3) | none |
| | 15 | pytest and engineering practice (15) | 5: pytest basics, fixtures and parametrize, test design and TDD, fakes and mocks, quality habits (coverage, linting, review) | browser (after adding pytest) | have part (assert tests) |
| **5 Advanced** | 16 | Concurrency, async, performance (16) | 5: measuring with timeit and profiling, threads and processes (PC), asyncio basics, async patterns, performance fundamentals | mixed | none |
| | 17 | Packaging, deployment, security (17) | 5: pyproject and packaging, building and publishing basics, deployment options, security basics (secrets, input checks, SQL injection, dependency risk), logging and configuration | pc | none |
| **6 Capstones** | 18 | Practical capstones (18) | 3: a data tool with SQLite and tests; an API report tool; a packaged command-line tool with README and CI notes | mixed | have 2 projects to reuse (customer cleaner, message sorter) |

Totals: about **90 lessons**, **18 checkpoints** (one per module). About 25 of the 57 lessons that exist today fit into this path and would be moved over and extended.

## How a learner moves through it
1. Lessons in order inside a module, with soft locks (a locked lesson can always be opened).
2. At the end of every lesson: the **review question** from an earlier lesson. Missing it adds it to the Revision
   centre, which already brings questions back.
3. At the end of every module: a **checkpoint** (about 8 mixed questions and one combined challenge, 70% to pass).
   Passing gives XP once and an achievement per stage.
4. Flashcards grow with every module (new words go into `glossary.json`).

## How I would build it, and how each batch is checked
1. **Renderer first** (one step): draw the new lesson fields and the checkpoint page, and add the path to the roadmap.
   The existing 57 lessons keep working unchanged.
2. **Add sqlite3 and pytest** to the saved Python files (after checking their size), with a test for each.
3. **One module per step**, in path order. For every batch:
   - `node tools/validate-lesson.mjs` on each lesson: shape, starters fail, solutions pass.
   - The browser test suites (exercises, examples, quizzes) and the accessibility scan.
   - A scan for stray formatting characters.
4. **Move existing lessons** into the new schema as their module comes up, without duplicating content.
5. A **final review pass**: prerequisites really point to earlier lessons, every review question comes from an
   earlier lesson, flashcards exist for every new term.

Rough size: modules of 4 to 6 lessons are about the same effort as the 7 lessons added last time, so the full path
is roughly 15 steps of that size, plus the renderer and the package steps.

## Decisions (answered)
1. Structure: approved.
2. Where it lives: (a), a new Python path track. Done: 34 lessons moved, old links and saved progress still work.
3. `sqlite3` and `pytest` added (2.15 MB, hashes checked). Both run in the page, offline.
4. Schema: approved.
