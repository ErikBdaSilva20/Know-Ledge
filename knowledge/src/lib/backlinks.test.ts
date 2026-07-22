import { describe, expect, it } from "vitest";
import { computeBacklinks, type BacklinksSource } from "./backlinks";
import type { Document, DocumentReference, SharedDocument, SharedDocumentReference } from "./types";

function doc(id: string, title: string, owner = "u1"): Document {
  return {
    id,
    owner_id: owner,
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

function pRef(
  source: string,
  targetScope: "personal" | "shared",
  target: string,
): DocumentReference {
  return {
    id: `r-${source}-${target}`,
    owner_id: "u1",
    source_document_id: source,
    target_scope: targetScope,
    target_document_id: target,
    created_at: "t",
  };
}

function sRef(source: string, target: string): SharedDocumentReference {
  return {
    id: `sr-${source}-${target}`,
    source_shared_document_id: source,
    target_shared_document_id: target,
    created_at: "t",
  };
}

function source(over: Partial<BacklinksSource> = {}): BacklinksSource {
  return {
    documents: [],
    shared_documents: [],
    document_references: [],
    shared_document_references: [],
    ...over,
  };
}

describe("computeBacklinks — personal scope", () => {
  it("lists personal docs that reference the target", () => {
    const s = source({
      documents: [doc("a", "A"), doc("b", "B")],
      document_references: [pRef("a", "personal", "b")],
    });
    expect(computeBacklinks(s, "personal", "b")).toEqual([
      { scope: "personal", id: "a", title: "A" },
    ]);
  });

  it("ignores refs that target a shared doc with the same id", () => {
    // A personal ref pointing at scope 'shared' must NOT surface as a backlink
    // for the personal doc of the same id.
    const s = source({
      documents: [doc("a", "A")],
      document_references: [pRef("a", "shared", "x")],
    });
    expect(computeBacklinks(s, "personal", "x")).toEqual([]);
  });

  it("drops a ref whose source document no longer exists", () => {
    const s = source({
      documents: [doc("b", "B")], // 'a' was deleted
      document_references: [pRef("a", "personal", "b")],
    });
    expect(computeBacklinks(s, "personal", "b")).toEqual([]);
  });
});

describe("computeBacklinks — shared scope", () => {
  it("includes both personal->shared and shared->shared references", () => {
    const s = source({
      documents: [doc("a", "Personal A")],
      shared_documents: [shared("x", "Shared X"), shared("y", "Shared Y")],
      document_references: [pRef("a", "shared", "x")],
      shared_document_references: [sRef("y", "x")],
    });
    const result = computeBacklinks(s, "shared", "x");
    expect(result).toContainEqual({ scope: "personal", id: "a", title: "Personal A" });
    expect(result).toContainEqual({ scope: "shared", id: "y", title: "Shared Y" });
    expect(result).toHaveLength(2);
  });

  it("does not treat a personal-scope ref as a shared backlink", () => {
    const s = source({
      documents: [doc("a", "A")],
      shared_documents: [shared("x", "X")],
      document_references: [pRef("a", "personal", "x")], // personal target, not shared
    });
    expect(computeBacklinks(s, "shared", "x")).toEqual([]);
  });
});
