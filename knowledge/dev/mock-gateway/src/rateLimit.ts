import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { ApiError } from "./errors.js";
import { SESSION_COOKIE } from "./middleware.js";

// Story 6.8 — a fixed-window limiter per session (falls back to IP for
// unauthenticated requests, e.g. repeated sign-in attempts). In-memory only:
// fine for a single-process dev harness, a real gateway would use a shared
// store (Redis) since it's horizontally scaled.
const WINDOW_MS = 60_000;
const MAX_MUTATIONS_PER_WINDOW = 60; // generous enough for auto-save, tight enough to catch a loop

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

function keyFor(c: Context): string {
  return getCookie(c, SESSION_COOKIE) ?? c.req.header("X-Forwarded-For") ?? "anonymous";
}

export async function rateLimitMutations(c: Context, next: Next) {
  if (c.req.method === "GET") return next(); // Story 6.8 AC#6 — reads stay generous/unlimited here

  const key = keyFor(c);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > MAX_MUTATIONS_PER_WINDOW) {
    throw new ApiError(429, "rate_limited", "Too many requests. Slow down and try again shortly.");
  }
  return next();
}
