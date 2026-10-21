import { setTheme } from './store.js';
import { loadModules, loadLesson, loadData } from './content.js';
import { applyAppearance, effectiveTheme } from './appearance.js';
import { renderModule, renderMessage } from './ui/home.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderRoadmap } from './ui/roadmap.js';
import { renderProgress } from './ui/progress.js';
import { renderSettings } from './ui/settings.js';
import { renderLesson } from './ui/lesson.js';
import { renderPractice } from './ui/practice.js';
import { renderRevise } from './ui/revise.js';
import { renderChallenge } from './ui/challenge.js';
import { renderWorkshop } from './ui/workshop.js';
import { renderWriting } from './ui/writing.js';
import { initRewards } from './ui/rewards.js';
import { focusScrollable } from './ui/html.js';

const main = document.getElementById('main');

const notFound = () => renderMessage(main, 'Page not found', 'That page does not exist.');

// Each handler loads its data, then returns a function that draws the page.
// This lets route() drop the result if the user already moved on.
const routes = [
  { nav: '/', pattern: /^\/?$/, handler: async () => {
    const modules = await loadModules();
    return () => renderDashboard(main, modules);
  } },
  { nav: '/roadmap', pattern: /^\/roadmap$/, handler: async () => {
    const modules = await loadModules();
    return () => renderRoadmap(main, modules);
  } },
  { nav: '/practice', pattern: /^\/practice$/, handler: async () => {
    const [{ cards }, workshop] = await Promise.all([loadData('glossary'), loadData('workshop')]);
    return () => renderPractice(main, { cards, workshop });
  } },
  { nav: '/practice', pattern: /^\/practice\/challenge$/, handler: async () => {
    const modules = await loadModules();
    return () => renderChallenge(main, modules);
  } },
  { nav: '/practice', pattern: /^\/practice\/revise$/, handler: async () => {
    const { cards } = await loadData('glossary');
    return () => renderRevise(main, cards);
  } },
  { nav: '/practice', pattern: /^\/practice\/projects$/, handler: async () => {
    const workshop = await loadData('workshop');
    return () => renderWorkshop(main, workshop);
  } },
  { nav: '/practice', pattern: /^\/practice\/linkedin$/, handler: async () => {
    const { drafts } = await loadData('writing');
    return () => renderWriting(main, drafts);
  } },
  { nav: '/progress', pattern: /^\/progress$/, handler: async () => {
    const modules = await loadModules();
    return () => renderProgress(main, modules);
  } },
  { nav: '/settings', pattern: /^\/settings$/, handler: async () => () => renderSettings(main, route) },
  { nav: '/roadmap', pattern: /^\/module\/([\w-]+)$/, handler: async (id) => {
    const module = (await loadModules()).find((m) => m.id === id);
    return module ? () => renderModule(main, module) : notFound;
  } },
  { nav: '/roadmap', pattern: /^\/lesson\/([\w-]+)\/([\w-]+)$/, handler: async (moduleId, lessonId) => {
    const module = (await loadModules()).find((m) => m.id === moduleId);
    if (!module?.lessons.some((l) => l.id === lessonId)) return notFound;
    const lesson = await loadLesson(moduleId, lessonId);
    return () => renderLesson(main, module, lessonId, lesson);
  } },
];

let latest = 0;

function markNav(active) {
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.getAttribute('href') === `#${active}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

async function route() {
  const mine = ++latest;
  const path = location.hash.slice(1);
  main.setAttribute('aria-busy', 'true');
  if (!main.firstChild) main.innerHTML = '<p class="loading">Loading…</p>';
  let draw = notFound;
  let nav = null;
  try {
    for (const { pattern, handler, nav: section } of routes) {
      const match = path.match(pattern);
      if (match) {
        draw = await handler(...match.slice(1));
        nav = section;
        break;
      }
    }
  } catch (err) {
    console.error(err);
    draw = () => renderMessage(main, 'Could not load', 'Check that the local server is running, then refresh.');
  }
  if (mine !== latest) return;
  markNav(nav);
  draw();
  main.removeAttribute('aria-busy');
  focusScrollable(main);
  main.focus();
  window.scrollTo(0, 0);
}

// The top bar button flips between light and dark. Settings has the full choice, including "system".
document.getElementById('theme-toggle').addEventListener('click', () => {
  setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
  applyAppearance();
});

applyAppearance();
window.addEventListener('hashchange', route);
window.addEventListener('resize', () => focusScrollable(main));
loadModules().then(initRewards).catch(() => {});
route();
