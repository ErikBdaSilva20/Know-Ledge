import { describe, expect, it } from "vitest";
import { isValidEmail, checkPassword } from "./validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("ana@empresa.com")).toBe(true);
  });

  it.each(["", "no-at.com", "a@b", "a @b.com", "a@b .com", "two@@b.com"])("rejects %j", (bad) => {
    expect(isValidEmail(bad)).toBe(false);
  });
});

describe("checkPassword", () => {
  it("accepts a password meeting every rule", () => {
    expect(checkPassword("abc12!")).toEqual({ valid: true });
  });

  it("rejects under 6 chars", () => {
    expect(checkPassword("a1!")).toMatchObject({ valid: false });
  });

  it("rejects with no digit", () => {
    expect(checkPassword("abcdef!")).toMatchObject({ valid: false });
  });

  it("rejects with no special char", () => {
    expect(checkPassword("abc123")).toMatchObject({ valid: false });
  });

  it("reports the length rule first when several fail", () => {
    // "abc" fails length, digit AND special — length message must win.
    expect(checkPassword("abc").message).toContain("6 caracteres");
  });
});
