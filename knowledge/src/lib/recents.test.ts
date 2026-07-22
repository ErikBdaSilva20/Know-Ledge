import { beforeEach, describe, expect, it } from "vitest";
import { getRecents, pushRecent } from "./recents";

beforeEach(() => {
  localStorage.clear();
});

describe("recents", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(getRecents()).toEqual([]);
  });

  it("pushes the most recent entry to the front", () => {
    pushRecent("personal", "a");
    pushRecent("personal", "b");
    const ids = getRecents().map((e) => e.id);
    expect(ids).toEqual(["b", "a"]);
  });

  it("de-duplicates by scope+id, moving a repeat to the front", () => {
    pushRecent("personal", "a");
    pushRecent("personal", "b");
    pushRecent("personal", "a"); // re-open A
    const recents = getRecents();
    expect(recents.map((e) => e.id)).toEqual(["a", "b"]);
    expect(recents).toHaveLength(2);
  });

  it("treats the same id in different scopes as distinct", () => {
    pushRecent("personal", "x");
    pushRecent("shared", "x");
    expect(getRecents()).toHaveLength(2);
  });

  it("caps the list at 15 entries", () => {
    for (let i = 0; i < 20; i++) pushRecent("personal", `d${i}`);
    const recents = getRecents();
    expect(recents).toHaveLength(15);
    // Newest kept, oldest evicted.
    expect(recents[0].id).toBe("d19");
    expect(recents.some((e) => e.id === "d4")).toBe(false);
  });

  it("survives corrupt storage without throwing", () => {
    localStorage.setItem("kv:recents:v1", "{not json");
    expect(getRecents()).toEqual([]);
  });
});
