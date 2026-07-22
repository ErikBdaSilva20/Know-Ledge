import { describe, expect, it } from "vitest";
import { extractWikiLinks, resolveWikiLink } from "./markdown";
import type { Document, SharedDocument } from "./types";

function doc(id: string, title: string): Document {
  return {
    id,
    owner_id: "u1",
    folder_id: null,
    title,
    content: "",
    owner_name: null,
    created_at: "t",
    updated_at: "t",
  };
}

function shared(id: string, title: string): SharedDocument {
  return {
    id,
    title,
    content: "",
    source_document_id: null,
    published_by: "u1",
    published_by_name: null,
    created_at: "t",
    updated_at: "t",
  };
}

describe("extractWikiLinks", () => {
  it("extracts a bare [[Title]] link", () => {
    expect(extractWikiLinks("see [[Roadmap]] here")).toEqual([{ title: "Roadmap", id: undefined }]);
  });

  it("extracts the embedded id from [[Title|id]]", () => {
    expect(extractWikiLinks("[[Roadmap|d42]]")).toEqual([{ title: "Roadmap", id: "d42" }]);
  });

  it("finds multiple links and trims whitespace", () => {
    expect(extractWikiLinks("[[ A ]] and [[B|b1]]")).toEqual([
      { title: "A", id: undefined },
      { title: "B", id: "b1" },
    ]);
  });

  it("returns nothing for content with no links", () => {
    expect(extractWikiLinks("plain text, no links")).toEqual([]);
  });
});

describe("resolveWikiLink", () => {
  const personal = [doc("d1", "Alpha")];
  const shareds = [shared("s1", "Alpha"), shared("s2", "Beta")];

  it("resolves by embedded id, preferring shared when the id is a shared doc", () => {
    expect(resolveWikiLink({ title: "whatever", id: "s2" }, personal, shareds)).toEqual({
      scope: "shared",
      id: "s2",
      title: "Beta",
    });
  });

  it("resolves an embedded id to a personal doc", () => {
    expect(resolveWikiLink({ title: "x", id: "d1" }, personal, shareds)).toEqual({
      scope: "personal",
      id: "d1",
      title: "Alpha",
    });
  });

  it("returns null for an embedded id that matches nothing (no title fallback)", () => {
    // An id was embedded but the target is gone — must NOT silently fall back
    // to a title match (that would resolve to the wrong doc after a delete).
    expect(resolveWikiLink({ title: "Alpha", id: "ghost" }, personal, shareds)).toBeNull();
  });

  it("falls back to a case-insensitive title match when no id is embedded", () => {
    expect(resolveWikiLink({ title: "alpha" }, personal, shareds)).toEqual({
      scope: "shared",
      id: "s1",
      title: "Alpha",
    });
  });

  it("prefers a shared title match over a personal one of the same name", () => {
    // Both 'Alpha' personal (d1) and 'Alpha' shared (s1) exist; shared wins.
    expect(resolveWikiLink({ title: "Alpha" }, personal, shareds)?.scope).toBe("shared");
  });

  it("returns null when a title matches nothing", () => {
    expect(resolveWikiLink({ title: "Nonexistent" }, personal, shareds)).toBeNull();
  });
});
