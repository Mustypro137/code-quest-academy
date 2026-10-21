export function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// A code block that scrolls sideways must be reachable with the keyboard.
// Only blocks that really scroll get a tab stop.
export function focusScrollable(root) {
  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.scrollWidth > pre.clientWidth) pre.tabIndex = 0;
    else pre.removeAttribute('tabindex');
  });
}

// Escapes text, then turns `backtick` words into <code> and **double-star** words into bold.
// Code spans are cut out first, so a Python `**` inside backticks can never start a bold.
export function inline(text) {
  return text.split(/(`[^`]+`)/).map((part, i) => (i % 2
    ? `<code>${esc(part.slice(1, -1))}</code>`
    : esc(part).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'))).join('');
}

// A progress bar. `percent` is 0 to 100. `label` tells screen readers what it measures.
export function bar(percent, label) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return `<div class="bar" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%"></span></div>`;
}
