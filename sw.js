// Service worker: makes the site work offline.
// - Files in vendor/ (Pyodide) never change, so the cache is used first.
// - Everything else tries the network first, so updates arrive, and falls back to the cache offline.
// SHELL must list every file in js/ and css/ (check-offline in docs/adding-lessons.md). Lessons are
// found from content/index.json, so new lessons need no change here.
const CACHE = 'cqa-v1';

const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/base.css', 'css/components.css', 'css/screens.css',
  'js/app.js', 'js/content.js', 'js/store.js', 'js/path.js', 'js/achievements.js', 'js/appearance.js',
  'js/python/runner.js', 'js/python/worker.js',
  'js/ui/backup.js', 'js/ui/codebox.js', 'js/ui/exercise.js', 'js/ui/home.js',
  'js/ui/html.js', 'js/ui/lesson.js', 'js/ui/quiz.js', 'js/ui/typing.js',
  'js/ui/dashboard.js', 'js/ui/roadmap.js', 'js/ui/progress.js', 'js/ui/settings.js', 'js/ui/rewards.js',
  'js/ui/practice.js', 'js/ui/revise.js', 'js/ui/challenge.js', 'js/ui/workshop.js', 'js/ui/writing.js',
  'content/glossary.json', 'content/workshop.json', 'content/writing.json',
  'icons/icon-192.png', 'icons/icon-512.png',
];

const PYODIDE = [
  'vendor/pyodide/pyodide.js', 'vendor/pyodide/pyodide.asm.js', 'vendor/pyodide/pyodide.asm.wasm',
  'vendor/pyodide/python_stdlib.zip', 'vendor/pyodide/pyodide-lock.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const index = await (await fetch('content/index.json', { cache: 'no-cache' })).json();
    const lessons = index.modules.flatMap((m) => m.lessons.map((l) => `content/${m.id}/${l.id}.json`));
    await cache.addAll([...SHELL, 'content/index.json', ...lessons]);
    // Python is large. If this part fails, the site still works online and caches it on first use.
    await cache.addAll(PYODIDE).catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(respond(request));
});

async function respond(request) {
  const cache = await caches.open(CACHE);
  if (request.url.includes('/vendor/')) {
    const hit = await cache.match(request);
    if (hit) return hit;
  }
  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    throw error;
  }
}
