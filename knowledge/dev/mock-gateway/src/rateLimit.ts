import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { ApiError } from "./errors.js";
import { SESSION_COOKIE } from "./middleware.js";
import { createRateLimitState, recordAndCheck } from "./rateLimiter.js";

// Story 6.8 — a fixed-window limiter per session (falls back to IP for
// unauthenticated requests, e.g. repeated sign-in attempts). In-memory only:
// fine for a single-process dev harness, a real gateway would use a shared
// store (Redis) since it's horizontally scaled.
const WINDOW_MS = 60_000;
const MAX_MUTATIONS_PER_WINDOW = 60; // generous enough for auto-save, tight enough to catch a loop

const state = createRateLimitState();

function keyFor(c: Context): string {
  return getCookie(c, SESSION_COOKIE) ?? c.req.header("X-Forwarded-For") ?? "anonymous";
}

export async function rateLimitMutations(c: Context, next: Next) {
  if (c.req.method === "GET") return next(); // Story 6.8 AC#6 — reads stay generous/unlimited here

  const allowed = recordAndCheck(state, keyFor(c), Date.now(), WINDOW_MS, MAX_MUTATIONS_PER_WINDOW);
  if (!allowed) {
    throw new ApiError(429, "rate_limited", "Too many requests. Slow down and try again shortly.");
  }
  return next();
}
