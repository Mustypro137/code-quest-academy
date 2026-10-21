// Page-side handle for the Python worker.
//   warmUp()  starts loading Python in the background (safe to call many times)
//   run(code, tests?, stdin?) -> Promise<{ output, error, results }>   runs one program at a time
//                        results is [{ pass, message }], one per test (see worker.js)
// A program that runs longer than TIMEOUT_MS is stopped by killing the worker;
// the next run starts a fresh one.
const TIMEOUT_MS = 10000;

let worker = null;
let ready = null;
let ready_ = false;
let current = null; // { id, finish } for the run in progress
let queue = Promise.resolve();
let seq = 0;

function boot() {
  ready_ = false;
  const w = new Worker(new URL('./worker.js', import.meta.url));
  worker = w;
  ready = new Promise((resolve, reject) => {
    w.onmessage = ({ data }) => {
      if (data.type === 'ready') {
        ready_ = true;
        resolve();
      } else if (data.type === 'failed') {
        reject(new Error(data.message));
      } else if (data.type === 'done' && current?.id === data.id) {
        current.finish(data);
      }
    };
    w.onerror = () => reject(new Error('Python could not start. Is the local server running?'));
  });
  // If startup fails, forget this worker so the next call can try again.
  ready.catch(() => {
    w.terminate();
    if (worker === w) worker = ready = null;
  });
}

export function isReady() {
  return ready_;
}

export function warmUp() {
  if (!worker) boot();
  return ready;
}

async function execute(code, tests, stdin) {
  await warmUp();
  const w = worker;
  return new Promise((resolve) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      current = null;
      w.terminate();
      worker = ready = null;
      ready_ = false;
      resolve({
        output: '',
        results: [],
        error: `Stopped: your code ran for more than ${TIMEOUT_MS / 1000} seconds. Check for a loop that never ends.`,
      });
    }, TIMEOUT_MS);
    current = {
      id,
      finish: ({ output, error, results }) => {
        clearTimeout(timer);
        current = null;
        resolve({ output, error, results });
      },
    };
    w.postMessage({ id, code, tests, stdin });
  });
}

export function run(code, tests, stdin) {
  const job = queue.then(() => execute(code, tests, stdin));
  queue = job.catch(() => {});
  return job;
}
