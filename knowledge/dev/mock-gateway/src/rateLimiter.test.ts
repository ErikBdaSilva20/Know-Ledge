import { describe, expect, it } from "vitest";
import { createRateLimitState, recordAndCheck } from "./rateLimiter";

const WINDOW = 60_000;
const MAX = 60;

describe("recordAndCheck", () => {
  it("allows up to the limit then blocks", () => {
    const state = createRateLimitState();
    const t = 1_000_000;
    for (let i = 1; i <= MAX; i++) {
      expect(recordAndCheck(state, "k", t, WINDOW, MAX)).toBe(true);
    }
    // The 61st hit in the same window is over the limit.
    expect(recordAndCheck(state, "k", t, WINDOW, MAX)).toBe(false);
  });

  it("resets the count once the window has elapsed", () => {
    const state = createRateLimitState();
    const t = 1_000_000;
    for (let i = 1; i <= MAX; i++) recordAndCheck(state, "k", t, WINDOW, MAX);
    expect(recordAndCheck(state, "k", t, WINDOW, MAX)).toBe(false);
    // Just past the window: fresh bucket, allowed again.
    expect(recordAndCheck(state, "k", t + WINDOW + 1, WINDOW, MAX)).toBe(true);
  });

  it("tracks keys independently", () => {
    const state = createRateLimitState();
    const t = 1_000_000;
    for (let i = 1; i <= MAX; i++) recordAndCheck(state, "a", t, WINDOW, MAX);
    expect(recordAndCheck(state, "a", t, WINDOW, MAX)).toBe(false);
    // A different session is unaffected.
    expect(recordAndCheck(state, "b", t, WINDOW, MAX)).toBe(true);
  });

  it("evicts stale buckets so the map does not grow unbounded (the L2 leak)", () => {
    const state = createRateLimitState();
    // 1000 one-shot keys at t0 — each leaves a bucket behind.
    for (let i = 0; i < 1000; i++) recordAndCheck(state, `key-${i}`, 1000, WINDOW, MAX);
    expect(state.buckets.size).toBe(1000);
    // A single request well past the window triggers the lazy sweep; every
    // stale bucket is evicted, leaving only the new one.
    recordAndCheck(state, "fresh", 1000 + WINDOW * 2, WINDOW, MAX);
    expect(state.buckets.size).toBe(1);
  });
});
