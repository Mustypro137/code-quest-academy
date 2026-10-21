// Loads lesson data. Lessons live at content/<moduleId>/<lessonId>.json.
let indexPromise;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.json();
}

// The Python path (content/curriculum.json) is a list of stages with modules. Each module ends with a checkpoint
// when it has one. The other modules come from content/index.json. Path modules carry track, stage and stageTitle.
function pathModules(curriculum) {
  return curriculum.stages.flatMap((stage) => stage.modules.map((m) => ({
    id: m.id,
    icon: m.icon,
    title: m.title,
    blurb: m.summary,
    track: 'python',
    stage: stage.id,
    stageTitle: stage.title,
    lessons: m.lessons.length && m.checkpoint
      ? [...m.lessons, { id: 'checkpoint', title: m.title + ' checkpoint', checkpoint: true }]
      : m.lessons,
  })));
}

export function loadModules() {
  indexPromise ??= Promise.all([getJson('content/curriculum.json'), getJson('content/index.json')])
    .then(([curriculum, index]) => [...pathModules(curriculum), ...index.modules])
    .catch((err) => {
      indexPromise = undefined; // allow a retry
      throw err;
    });
  return indexPromise;
}

export function loadLesson(moduleId, lessonId) {
  return getJson(`content/${moduleId}/${lessonId}.json`);
}

// Other content files, such as content/glossary.json. Loaded once.
const dataCache = {};
export function loadData(name) {
  dataCache[name] ??= getJson(`content/${name}.json`).catch((err) => {
    delete dataCache[name]; // allow a retry
    throw err;
  });
  return dataCache[name];
}
