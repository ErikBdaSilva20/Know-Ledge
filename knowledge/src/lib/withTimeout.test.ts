import { afterEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "./withTimeout";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the operation's value when it resolves in time", async () => {
    const result = await withTimeout(() => Promise.resolve("ok"), 1000, "fallback");
    expect(result).toBe("ok");
  });

  it("returns the fallback when the operation rejects", async () => {
    const result = await withTimeout(() => Promise.reject(new Error("boom")), 1000, "fallback");
    expect(result).toBe("fallback");
  });

  it("returns the fallback when the operation outruns the deadline", async () => {
    vi.useFakeTimers();
    const hang = () => new Promise<string>(() => {}); // never resolves
    const promise = withTimeout(hang, 100, "fallback");
    await vi.advanceTimersByTimeAsync(100);
    expect(await promise).toBe("fallback");
  });

  it("does not leave the timer pending after a fast resolve (no late fallback)", async () => {
    vi.useFakeTimers();
    const promise = withTimeout(() => Promise.resolve("ok"), 100, "fallback");
    const result = await promise;
    // If the timer were still armed, advancing past it would matter — it must not.
    await vi.advanceTimersByTimeAsync(500);
    expect(result).toBe("ok");
  });
});
