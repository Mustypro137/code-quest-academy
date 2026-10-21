// Runs Python with Pyodide, away from the page, so a stuck program cannot freeze the UI.
// Messages in:  { id, code, tests?, stdin? }   stdin is the text typed in the Input box: one line per input()
// Messages out: { type: 'ready' } | { type: 'failed', message }
//             | { type: 'done', id, output, error, results }
//
// A test is one of:
//   { output: "text" }                      the program must print exactly this
//   { call: "f(2)", returns: "4" }          evaluate an expression after the program ran;
//                                           `returns` is a Python literal
//   { contains: "text" }                    the printed text must include this
//   optional on a call test: setup (Python statements run first), label (name used in messages)
importScripts('../../vendor/pyodide/pyodide.js');

const MAX_OUTPUT = 100000; // characters; stops a print loop from flooding the page

let text = '';
const decoder = new TextDecoder();

// Receives raw bytes from Python's stdout and stderr, in the order they were written.
function write(bytes) {
  if (text.length <= MAX_OUTPUT) {
    text += decoder.decode(bytes, { stream: true });
    if (text.length > MAX_OUTPUT) text += '\n... (output cut: too long)';
  }
  return bytes.length;
}

// Python's own traceback starts with Pyodide's internal frames. Show only the learner's code.
function friendlyError(err) {
  const msg = String(err && err.message ? err.message : err).trim();
  const rows = msg.split('\n');
  const start = rows.findIndex((r) => r.includes('File "<exec>"'));
  if (start === -1) return msg;
  return ['Traceback (most recent call last):', ...rows.slice(start)].join('\n');
}

const tidy = (s) => s.split('\n').map((l) => l.trimEnd()).join('\n').trim();

const CHECK_HELPER = `
import ast, builtins, os, shutil, tempfile

# input() reads the lines from the Input box, one per call, and shows them like a terminal would.
# When the lines run out it raises EOFError, with a message that says what to do.
def _cqa_install_input(lines):
    pending = list(lines)
    def input(prompt=""):
        print(prompt, end="")
        if not pending:
            raise EOFError("input() needs another line. Add one line for each input() in the Input box.")
        line = pending.pop(0)
        print(line)
        return line
    builtins.input = input

# Every run gets its own empty practice folder, removed afterwards, so files from
# one program (or one exercise) can never leak into the next.
def _cqa_enter():
    folder = tempfile.mkdtemp()
    os.chdir(folder)
    return folder

def _cqa_leave(folder):
    os.chdir("/")
    shutil.rmtree(folder, ignore_errors=True)

def _cqa_check(setup, call, returns, label, g):
    name = label or call
    try:
        if setup:
            exec(setup, g)
        got = eval(call, g)
    except Exception as e:
        return (False, f"{name} caused an error: {type(e).__name__}: {e}")
    want = ast.literal_eval(returns)
    if got == want:
        return (True, f"{name} is correct: {want!r}")
    if label:
        return (False, f"{label} should be {want!r}, but it was {got!r}")
    return (False, f"{call} should give {want!r}, but gave {got!r}")
`;

function runTests(py, tests, globals, printed) {
  const check = py.globals.get('_cqa_check');
  try {
    return tests.map((t) => {
      if ('output' in t) {
        const pass = tidy(printed) === tidy(t.output);
        return {
          pass,
          message: pass
            ? 'Your program prints the right text.'
            : `Your program should print:\n${t.output}\n\nBut it printed:\n${printed || '(nothing)'}`,
        };
      }
      if ('contains' in t) {
        const pass = printed.includes(t.contains);
        return {
          pass,
          message: pass
            ? `Your program prints "${t.contains}".`
            : `Your program should print "${t.contains}", but it printed:\n${printed || '(nothing)'}`,
        };
      }
      const result = check(t.setup ?? '', t.call, t.returns, t.label ?? '', globals);
      const [pass, message] = result.toJs();
      result.destroy();
      return { pass, message };
    });
  } finally {
    check.destroy();
  }
}

const ready = loadPyodide({ indexURL: new URL('../../vendor/pyodide/', self.location.href).href })
  .then((py) => {
    py.setStdout({ write });
    py.setStderr({ write });
    py.setStdin({ stdin: () => undefined }); // sys.stdin stays empty; input() is replaced in _cqa_install_input
    py.runPython(CHECK_HELPER);
    postMessage({ type: 'ready' });
    return py;
  })
  .catch((err) => {
    postMessage({ type: 'failed', message: String(err && err.message ? err.message : err) });
  });

// "a\nb\n" -> ["a", "b"]. One trailing newline does not make an extra empty line.
function inputLines(stdin) {
  if (!stdin) return [];
  const lines = stdin.replaceAll('\r\n', '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

self.onmessage = async ({ data: { id, code, tests, stdin } }) => {
  const py = await ready;
  if (!py) return;
  text = '';
  let error = null;
  let results = [];
  const globals = py.globals.get('dict')(); // fresh variables for every run
  const workDir = py.runPython('_cqa_enter()');
  try {
    py.runPython(`_cqa_install_input(${JSON.stringify(inputLines(stdin))})`);
    await py.runPythonAsync(code, { globals });
    py.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()');
    const printed = text.trimEnd();
    if (tests) results = runTests(py, tests, globals, printed);
    text = printed; // anything the tests print is not the learner's output
  } catch (err) {
    error = friendlyError(err);
  } finally {
    globals.destroy();
    py.runPython(`_cqa_leave(${JSON.stringify(workDir)})`);
  }
  postMessage({ type: 'done', id, output: text.trimEnd(), error, results });
};
