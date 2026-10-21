// Loads lesson data. Lessons live at content/<moduleId>/<lessonId>.json.
let indexPromise;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.json();
}

export function loadModules() {
  indexPromise ??= getJson('content/index.json')
    .then((data) => data.modules)
    .catch((err) => {
      indexPromise = undefined; // allow a retry
      throw err;
    });
  return indexPromise;
}

export function loadLesson(moduleId, lessonId) {
  return getJson(`content/${moduleId}/${lessonId}.json`);
}
