# Pyodide (vendored)

Python for the browser, saved here so the site works offline.

- Version: 0.29.5 (npm package `pyodide`)
- Source: https://cdn.jsdelivr.net/npm/pyodide@0.29.5/
- Files: `pyodide.js`, `pyodide.asm.js`, `pyodide.asm.wasm`, `python_stdlib.zip`, `pyodide-lock.json`
- Checked against the SHA-256 hashes published by jsDelivr when downloaded.

Extra Python packages saved here (sha256 checked against pyodide-lock.json, from https://cdn.jsdelivr.net/pyodide/v0.29.5/full/),
loaded only when a program imports them (see js/python/worker.js):
- `sqlite3`
- `pytest` and what it needs: atomicwrites, attrs, exceptiongroup, iniconfig, more_itertools, pluggy, py, pyparsing,
  setuptools, six

Other packages (such as numpy) are not included. Add them only when a lesson needs them.

License: Pyodide is released under the Mozilla Public License 2.0 (https://github.com/pyodide/pyodide).
