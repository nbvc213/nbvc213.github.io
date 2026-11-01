/** Serialize builds and retain every kind of change arriving during a build. */
export function createRebuildQueue(build, onError = console.error) {
  const pending = new Set();
  let running;
  return function request(kind) {
    pending.add(kind);
    if (!running) running = Promise.resolve().then(async () => {
      while (pending.size) {
        const changes = new Set(pending); pending.clear();
        try { await build(changes); } catch (error) { onError(error); }
      }
    }).finally(() => { running = undefined; });
    return running;
  };
}
