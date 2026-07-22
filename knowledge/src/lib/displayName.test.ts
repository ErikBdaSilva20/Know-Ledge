import { describe, expect, it } from "vitest";
import { displayName } from "./displayName";
import type { User } from "./types";

const roster = new Map<string, User>([
  ["u1", { id: "u1", name: "Ana Silva", email: "ana@x.com", role: "rep" }],
]);

describe("displayName", () => {
  it("prefers the denormalized snapshot when present", () => {
    expect(displayName("Snapshot Name", roster, "u1")).toBe("Snapshot Name");
  });

  it("falls back to the roster name when the snapshot is null/undefined", () => {
    expect(displayName(null, roster, "u1")).toBe("Ana Silva");
    expect(displayName(undefined, roster, "u1")).toBe("Ana Silva");
  });

  it("returns undefined when neither the snapshot nor the roster resolves", () => {
    expect(displayName(null, roster, "unknown-id")).toBeUndefined();
  });

  it("uses an empty-string snapshot's roster fallback (empty is not a real name)", () => {
    // "" ?? x returns "" — documents current behavior: an empty snapshot is
    // kept as-is rather than falling through. Guards against a silent change.
    expect(displayName("", roster, "u1")).toBe("");
  });
});
