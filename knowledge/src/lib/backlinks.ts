import type {
  Document,
  DocumentReference,
  Scope,
  SharedDocument,
  SharedDocumentReference,
} from "./types";

export interface Backlink {
  scope: Scope;
  id: string;
  title: string;
}

// Narrowed to just what the computation reads (not the full mock DbState) so
// it works equally well fed from useDb (mock) or from gateway repo.list()
// calls — Backlinks/Graph need this in both modes.
export interface BacklinksSource {
  documents: Document[];
  shared_documents: SharedDocument[];
  document_references: DocumentReference[];
  shared_document_references: SharedDocumentReference[];
}

export function computeBacklinks(state: BacklinksSource, scope: Scope, id: string): Backlink[] {
  const out: Backlink[] = [];
  if (scope === "personal") {
    for (const r of state.document_references) {
      if (r.target_scope === "personal" && r.target_document_id === id) {
        const src = state.documents.find((d) => d.id === r.source_document_id);
        if (src) out.push({ scope: "personal", id: src.id, title: src.title });
      }
    }
  } else {
    for (const r of state.document_references) {
      if (r.target_scope === "shared" && r.target_document_id === id) {
        const src = state.documents.find((d) => d.id === r.source_document_id);
        if (src) out.push({ scope: "personal", id: src.id, title: src.title });
      }
    }
    for (const r of state.shared_document_references) {
      if (r.target_shared_document_id === id) {
        const src = state.shared_documents.find((d) => d.id === r.source_shared_document_id);
        if (src) out.push({ scope: "shared", id: src.id, title: src.title });
      }
    }
  }
  return out;
}
