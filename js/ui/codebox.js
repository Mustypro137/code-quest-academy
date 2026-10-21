import { esc } from './html.js';
import { run, isReady, warmUp } from '../python/runner.js';

let counter = 0;

// An editable Python box with Run and Reset buttons and an output panel.
// With options.tests it also gets a Check button that runs the tests and lists the results.
// options.onCheck(allPassed) is called after every check that could run the tests.
// options.input is the starting text of the Input box (one line for each input() call).
// Run uses what is in the box. Check always uses options.input, so the tests stay fair.
const USES_INPUT = /\binput\s*\(/;

export function mountCodeBox(el, code, { tests, onCheck, input } = {}) {
  const id = `editor-${++counter}`;
  const rows = code.split('\n').length + 1;
  el.innerHTML = `
    <label class="sr-only" for="${id}">Python code. Press Ctrl+Enter to run. Tab indents. Press Escape, then Tab, to leave the box.</label>
    <textarea id="${id}" class="code editor" rows="${rows}" spellcheck="false" autocapitalize="off" autocomplete="off">${esc(code)}</textarea>
    <p class="editor-hint" aria-hidden="true">Tab indents · Esc then Tab leaves the box · Ctrl+Enter runs</p>
    <div class="stdin" hidden>
      <label for="${id}-in">Input for the program: one line for each <code>input()</code>${input !== undefined ? '. Check always uses the first lines you see here.' : ''}</label>
      <textarea id="${id}-in" class="code editor stdin-box" rows="2" spellcheck="false" autocapitalize="off" autocomplete="off">${esc(input ?? '')}</textarea>
    </div>
    <div class="codebox-bar">
      <button class="btn run-btn" type="button">▶ Run</button>
      ${tests ? '<button class="btn check-btn" type="button">✔ Check my answer</button>' : ''}
      <button class="btn btn-ghost reset-btn" type="button">Reset</button>
    </div>
    <pre class="output" role="status" hidden></pre>
    <div class="results" role="status" hidden></div>`;

  const editor = el.querySelector('textarea');
  const stdinBox = el.querySelector('.stdin-box');
  // The Input box shows when the program asks for input, and always when the exercise needs it.
  const syncInput = () => { el.querySelector('.stdin').hidden = input === undefined && !USES_INPUT.test(editor.value); };
  syncInput();
  editor.addEventListener('input', syncInput);
  const buttons = [...el.querySelectorAll('.codebox-bar .btn')];
  const output = el.querySelector('.output');
  const results = el.querySelector('.results');

  function showOutput(message, isError) {
    output.hidden = false;
    output.textContent = message;
    output.classList.toggle('error', isError);
  }

  function showResults(list) {
    const passed = list.filter((r) => r.pass).length;
    results.hidden = false;
    results.classList.toggle('all-passed', passed === list.length);
    results.innerHTML = `
      <p><strong>${passed === list.length
        ? '🎉 All tests passed!'
        : `${passed} of ${list.length} tests passed. Keep going!`}</strong></p>
      <ul>${list.map((r) => `<li class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} <span>${esc(r.message)}</span></li>`).join('')}</ul>`;
  }

  async function execute(withTests) {
    if (buttons[0].disabled) return;
    buttons.forEach((b) => { b.disabled = true; });
    results.hidden = true;
    showOutput(isReady() ? 'Running…' : 'Starting Python… (the first run takes a few seconds)', false);
    try {
      const r = await run(editor.value, withTests ? tests : undefined, withTests && input !== undefined ? input : stdinBox.value);
      showOutput([r.output, r.error].filter(Boolean).join('\n') || '(no output)', Boolean(r.error));
      if (withTests && !r.error && r.results.length) {
        showResults(r.results);
        onCheck?.(r.results.every((t) => t.pass));
      } else if (withTests && r.error) {
        results.hidden = false;
        results.classList.remove('all-passed');
        results.innerHTML = '<p>Your code has an error, so the tests could not run. Fix the error above and try again.</p>';
        onCheck?.(false);
      }
    } catch (err) {
      showOutput(err.message, true);
    } finally {
      buttons.forEach((b) => { b.disabled = false; });
    }
  }

  el.querySelector('.run-btn').addEventListener('click', () => execute(false));
  el.querySelector('.check-btn')?.addEventListener('click', () => execute(true));
  // Python needs indentation, so Tab indents. Keyboard users can still leave the box:
  // press Escape, then Tab.
  let tabLeaves = false;

  function insert(text) {
    if (!document.execCommand('insertText', false, text)) { // execCommand keeps undo working
      editor.setRangeText(text, editor.selectionStart, editor.selectionEnd, 'end');
    }
  }

  editor.addEventListener('keydown', (e) => {
    const plain = !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      execute(false);
    } else if (e.key === 'Escape') {
      tabLeaves = true;
    } else if (e.key === 'Tab' && plain && !tabLeaves) {
      e.preventDefault();
      insert('    ');
    } else if (e.key === 'Enter' && plain) {
      // Keep the indentation of the line above, and add 4 spaces after a colon.
      const before = editor.value.slice(0, editor.selectionStart);
      const line = before.slice(before.lastIndexOf('\n') + 1);
      const indent = line.match(/^ */)[0] + (line.trimEnd().endsWith(':') ? '    ' : '');
      if (indent) {
        e.preventDefault();
        insert('\n' + indent);
      }
    }
    if (e.key !== 'Escape' && e.key !== 'Tab' && e.key !== 'Shift') tabLeaves = false;
  });
  editor.addEventListener('blur', () => { tabLeaves = false; });
  el.querySelector('.reset-btn').addEventListener('click', () => {
    editor.value = code;
    stdinBox.value = input ?? '';
    syncInput();
    output.hidden = true;
    results.hidden = true;
  });
}

export { warmUp };
