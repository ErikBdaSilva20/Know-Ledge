import { describe, expect, it } from "vitest";
import { isAllowedDevOrigin } from "./cors";

describe("isAllowedDevOrigin", () => {
  it("accepts the default Vite port", () => {
    expect(isAllowedDevOrigin("http://localhost:5173")).toBe("http://localhost:5173");
  });

  it("accepts a climbed Vite port (the M1 bug)", () => {
    // The whole point: a hard-pinned :5173 broke everything when Vite fell
    // back to 5174/5175. Any localhost port must be allowed.
    expect(isAllowedDevOrigin("http://localhost:5175")).toBe("http://localhost:5175");
  });

  it("accepts 127.0.0.1 on any port", () => {
    expect(isAllowedDevOrigin("http://127.0.0.1:4321")).toBe("http://127.0.0.1:4321");
  });

  it("rejects a non-localhost origin", () => {
    expect(isAllowedDevOrigin("https://evil.example.com")).toBeNull();
  });

  it("rejects a missing origin", () => {
    expect(isAllowedDevOrigin(undefined)).toBeNull();
  });

  it("rejects a malformed origin", () => {
    expect(isAllowedDevOrigin("not-a-url")).toBeNull();
  });

  it("honours an explicit non-localhost DEV_ORIGIN", () => {
    const dev = "https://kv.dev.internal";
    expect(isAllowedDevOrigin(dev, dev)).toBe(dev);
    expect(isAllowedDevOrigin("https://other.internal", dev)).toBeNull();
  });
});
