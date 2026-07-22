// Pure fixed-window rate-limit core, extracted from the Hono middleware so the
// window/limit/eviction logic is unit-testable without HTTP. The middleware
// (rateLimit.ts) is a thin adapter over this.

export interface Bucket {
  count: number;
  windowStart: number;
}

export interface RateLimitState {
  buckets: Map<string, Bucket>;
  lastSweep: number;
}

export function createRateLimitState(): RateLimitState {
  return { buckets: new Map(), lastSweep: 0 };
}

// Records one hit for `key` and reports whether it's within the limit. Also
// lazily evicts expired buckets at most once per window, so the map can't grow
// unbounded from keys that stop sending traffic (the original leak: buckets
// were only ever reset on reuse, never removed when a session went quiet).
export function recordAndCheck(
  state: RateLimitState,
  key: string,
  now: number,
  windowMs: number,
  maxPerWindow: number,
): boolean {
  if (now - state.lastSweep > windowMs) {
    for (const [k, b] of state.buckets) {
      if (now - b.windowStart > windowMs) state.buckets.delete(k);
    }
    state.lastSweep = now;
  }

  const bucket = state.buckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    state.buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= maxPerWindow;
}
