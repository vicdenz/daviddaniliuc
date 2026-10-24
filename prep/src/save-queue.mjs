// Keep writes to each buffer in edit order, even when requests are slow or fail.
export function createSaveQueue() {
  const pending = new Map();
  return (key, write) => {
    const next = (pending.get(key) ?? Promise.resolve())
      .catch(() => {})
      .then(write);
    pending.set(key, next);
    const clean = () => {
      if (pending.get(key) === next) pending.delete(key);
    };
    next.then(clean, clean);
    return next;
  };
}
