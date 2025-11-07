// Simple offline cache using localStorage
// Keys are namespaced with a version for future migrations

const makeKey = (name: string) => `trace-cache:${name}:v1`;

export function saveCache<T>(name: string, data: T) {
  try {
    const payload = JSON.stringify({ ts: Date.now(), data });
    localStorage.setItem(makeKey(name), payload);
  } catch {}
}

export function loadCache<T>(name: string): T | null {
  try {
    const raw = localStorage.getItem(makeKey(name));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && parsed.data) ?? null;
  } catch {
    return null;
  }
}


