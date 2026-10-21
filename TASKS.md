# Tasks

What is left to build, in order. Tick a box when the work is done **and** checked.

A module is **done** when:
- every lesson uses the full schema ([docs/curriculum-schema.md](docs/curriculum-schema.md));
- `node tools/validate-lesson.mjs content/<module>/*.json` passes;
- it has a checkpoint;
- the browser tests and the accessibility scans pass.

Lessons marked **upgrade** already exist (they were moved in from Python Basics or Automation) but still use the old
format. Lessons marked **new** must be written.

## Python path

### Stage 1: Foundations
- [x] **m01 Programming fundamentals**: 6 lessons and a checkpoint
- [ ] **m02 Conditions, loops and logic**
  - [ ] new: `01-booleans` (booleans and comparisons)
  - [ ] upgrade: `02-conditions`
  - [ ] upgrade: `03-loops`
  - [ ] new: `04-nesting-break-continue`
  - [ ] new: `05-tracing` (thinking in steps)
  - [ ] checkpoint
- [ ] **m03 Strings and collections**
  - [ ] upgrade: `01-strings`, `02-lists`, `03-tuples-sets`, `04-dictionaries`, `05-sorting`, `07-regex`
  - [ ] new: `06-choosing` (choosing a data structure)
  - [ ] checkpoint
- [x] **m04 Functions**: 5 lessons and a checkpoint

### Stage 2: Working tools
- [ ] **m05 Modules and environments**
  - [ ] upgrade: `01-import`, `03-dates`
  - [ ] new: `02-stdlib-tour`, `04-packages`, `06-dependencies`
  - [x] `05-virtual-environments`
  - [ ] checkpoint
- [ ] **m06 Errors, debugging and testing**
  - [ ] new: `01-tracebacks`, `03-raising`, `04-debugging`, `05-assert-doctest`, `06-unittest`
  - [ ] upgrade: `02-try-except`
  - [ ] checkpoint
- [ ] **m07 Reading and writing files**
  - [ ] upgrade: `01-text-files`, `02-json`, `03-csv`, `05-excel`
  - [ ] new: `04-other-formats` (configparser, tomllib, zip), `06-encodings-safe-writing`
  - [ ] checkpoint
- [ ] **m08 Paths and folders**
  - [ ] new: `01-pathlib`, `02-os`, `03-shutil`
  - [ ] upgrade: `04-merge-csv`, `05-duplicates`
  - [ ] checkpoint

### Stage 3: Pythonic code
- [ ] **m09 Pythonic tools**
  - [ ] upgrade: `01-comprehensions`, `03-generators`, `04-decorators`, `05-context-managers`
  - [ ] new: `02-iterators-itertools`
  - [ ] checkpoint
- [ ] **m10 Object-oriented programming**
  - [ ] upgrade: `01-classes`, `04-dataclasses`
  - [ ] new: `02-special-methods`, `03-inheritance-composition`, `05-enums-properties`
  - [ ] checkpoint
- [ ] **m11 Types and clean code** (all new): type hints, readable code, refactoring, maintainability; checkpoint

### Stage 4: Professional skills
- [ ] **m12 Git, command line and structure** (all new): command line, Git basics, GitHub and branches, argparse
  tool, project structure; checkpoint
- [ ] **m13 HTTP and APIs**
  - [ ] new: `01-http-basics`, `02-requests` (PC), `04-json-apis`, `05-env-secrets`, `06-errors-retries`
  - [ ] upgrade: `03-web-data`, `07-email`
  - [ ] checkpoint
- [ ] **m14 SQLite and SQL** (all new, runs in the page): tables and SELECT, INSERT/UPDATE/DELETE,
  WHERE/ORDER/aggregates, JOIN, `sqlite3` with parameters, designing a schema; checkpoint
- [ ] **m15 pytest and engineering** (all new, runs in the page): pytest basics, fixtures and parametrize, test
  design and TDD, fakes and mocks, quality habits; checkpoint
  - [ ] first: a small helper so exercises can run a learner's test file with `pytest.main(...)` and check the result

### Stage 5: Advanced topics
- [ ] **m16 Concurrency and performance**
  - [ ] new: `01-measuring`, `02-threads-processes` (PC), `03-asyncio`, `04-async-patterns`, `06-algorithms`
  - [ ] upgrade: `05-recursion-memo`
  - [ ] checkpoint
- [ ] **m17 Packaging, deployment and security** (all new, PC): pyproject and packaging, building and publishing,
  deployment options, security basics, logging and configuration; checkpoint

### Stage 6: Capstones
- [ ] **m18 Capstone projects**
  - [ ] upgrade: `01-cleaning`, `02-reports`, `03-customer-cleaner`
  - [ ] new: `04-sqlite-data-tool`, `05-api-report-tool`, `06-packaged-cli`
  - [ ] checkpoint

### When the path is complete
- [ ] Check that every `prerequisites` entry points to an earlier lesson.
- [ ] Check that every review question comes from an earlier lesson.
- [ ] Add flashcards to `content/glossary.json` for every new term.
- [ ] One achievement for finishing each stage.
- [ ] Update the build status in [docs/curriculum-plan.md](docs/curriculum-plan.md) and the README.

## Other work
- [ ] Put the browser test scripts into the repository (they only exist in a temporary folder now). The lesson
  checker `tools/validate-lesson.mjs` is already in the repository.
- [ ] Decide whether the Projects module should link to the Python path lessons that now cover the same ideas
  (testing, errors, Git), so they do not repeat each other.

## For you to check by hand
- [ ] Run the PC-only code once on your own computer, with a throwaway test: email (send to yourself first), web
  requests, Excel, Git, the real AI model, and virtual environments.
- [ ] Install the site as an app on your phone.
- [ ] Try the site with only the keyboard, and with a screen reader if you can.
- [ ] Read the writing lessons (LinkedIn and English) and check that the advice sounds like you.
