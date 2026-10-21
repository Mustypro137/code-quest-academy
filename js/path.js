import { isDone, getSettings } from './store.js';

// The state of every lesson in a module, in order:
//   done       finished
//   current    the next one to do
//   available  can be started (only after finishing lessons out of order, or with "Unlock everything")
//   locked     the lesson before it is not finished yet
// Locks are soft: a locked lesson can always be opened, the app only recommends the order.
export function lessonStates(module) {
  const unlockAll = getSettings().unlockAll;
  let currentFound = false;
  return module.lessons.map((lesson, i) => {
    if (isDone(module.id, lesson.id)) return 'done';
    const open = unlockAll || i === 0 || isDone(module.id, module.lessons[i - 1].id);
    if (!open) return 'locked';
    if (currentFound) return 'available';
    currentFound = true;
    return 'current';
  });
}

// The first module that has a lesson to do, with that lesson. null when everything is done.
export function nextLesson(modules) {
  for (const module of modules) {
    const states = lessonStates(module);
    const i = states.indexOf('current');
    if (i !== -1) return { module, lesson: module.lessons[i], index: i };
  }
  return null;
}
