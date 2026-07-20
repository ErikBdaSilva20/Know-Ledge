// Story 5.5 AC#3 — in-memory only (dev-only harness, single process, thrown
// away on restart). A real gateway would persist this; here it just needs to
// survive the lifetime of a docker-compose session to prove double-clicking
// "Publicar" doesn't create two shared_documents.
interface CachedResponse {
  status: number;
  body: unknown;
  cachedAt: number;
}

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CachedResponse>();

export function getCached(key: string): CachedResponse | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry;
}

export function setCached(key: string, status: number, body: unknown): void {
  cache.set(key, { status, body, cachedAt: Date.now() });
}
