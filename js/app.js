import { getTheme, setTheme } from './store.js';
import { loadModules, loadLesson } from './content.js';
import { renderHome, renderModule, renderMessage } from './ui/home.js';
import { renderLesson } from './ui/lesson.js';
import { focusScrollable } from './ui/html.js';

const main = document.getElementById('main');

const notFound = () => renderMessage(main, 'Page not found', 'That page does not exist.');

// Each handler loads its data, then returns a function that draws the page.
// This lets route() drop the result if the user already moved on.
const routes = [
  { pattern: /^\/?$/, handler: async () => {
    const modules = await loadModules();
    return () => renderHome(main, modules, route);
  } },
  { pattern: /^\/module\/([\w-]+)$/, handler: async (id) => {
    const module = (await loadModules()).find((m) => m.id === id);
    return module ? () => renderModule(main, module) : notFound;
  } },
  { pattern: /^\/lesson\/([\w-]+)\/([\w-]+)$/, handler: async (moduleId, lessonId) => {
    const module = (await loadModules()).find((m) => m.id === moduleId);
    if (!module?.lessons.some((l) => l.id === lessonId)) return notFound;
    const lesson = await loadLesson(moduleId, lessonId);
    return () => renderLesson(main, module, lessonId, lesson);
  } },
];

let latest = 0;

async function route() {
  const mine = ++latest;
  const path = location.hash.slice(1);
  main.setAttribute('aria-busy', 'true');
  if (!main.firstChild) main.innerHTML = '<p class="loading">Loading…</p>';
  let draw = notFound;
  try {
    for (const { pattern, handler } of routes) {
      const match = path.match(pattern);
      if (match) {
        draw = await handler(...match.slice(1));
        break;
      }
    }
  } catch (err) {
    console.error(err);
    draw = () => renderMessage(main, 'Could not load', 'Check that the local server is running, then refresh.');
  }
  if (mine !== latest) return;
  draw();
  main.removeAttribute('aria-busy');
  focusScrollable(main);
  main.focus();
  window.scrollTo(0, 0);
}

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  setTheme(next);
});

if (getTheme()) document.documentElement.dataset.theme = getTheme();
window.addEventListener('hashchange', route);
window.addEventListener('resize', () => focusScrollable(main));
route();
