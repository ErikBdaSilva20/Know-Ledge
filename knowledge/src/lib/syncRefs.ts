import { getState, mutate } from "./mockDb";
import { extractWikiLinks, resolveWikiLink } from "./markdown";
import type { Scope } from "./types";
import { genId, isoNow } from "./mockDb";

// Rebuild references from a document's content
export function syncPersonalRefs(docId: string) {
  const s = getState();
  const doc = s.documents.find((d) => d.id === docId);
  if (!doc) return;
  const links = extractWikiLinks(doc.content);
  mutate((db) => {
    db.document_references = db.document_references.filter((r) => r.source_document_id !== docId);
    // A personal link only ever resolves within the same owner's own documents.
    const ownDocs = db.documents.filter((d) => d.owner_id === doc.owner_id);
    for (const link of links) {
      const resolved = resolveWikiLink(link, ownDocs, db.shared_documents);
      if (!resolved || (resolved.scope === "personal" && resolved.id === docId)) continue;
      db.document_references.push({
        id: genId("r"),
        owner_id: doc.owner_id,
        source_document_id: docId,
        target_scope: resolved.scope,
        target_document_id: resolved.id,
        created_at: isoNow(),
      });
    }
  });
}

export function syncSharedRefs(sharedId: string) {
  const s = getState();
  const doc = s.shared_documents.find((d) => d.id === sharedId);
  if (!doc) return;
  const links = extractWikiLinks(doc.content);
  mutate((db) => {
    db.shared_document_references = db.shared_document_references.filter(
      (r) => r.source_shared_document_id !== sharedId,
    );
    for (const link of links) {
      // ADR-005 / Documento 01 §5.2: a shared document can only reference another shared document.
      const resolved = resolveWikiLink(link, [], db.shared_documents);
      if (!resolved || resolved.id === sharedId) continue;
      db.shared_document_references.push({
        id: genId("sr"),
        source_shared_document_id: sharedId,
        target_shared_document_id: resolved.id,
        created_at: isoNow(),
      });
    }
  });
}

export function syncAllRefsFor(scope: Scope, id: string) {
  if (scope === "personal") syncPersonalRefs(id);
  else syncSharedRefs(id);
}
