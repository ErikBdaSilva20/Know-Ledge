import { genId, getState, isoNow, mutate } from "../mockDb";
import type { SharedDocument } from "../types";

export const sharedDocumentsRepo = {
  async list(): Promise<SharedDocument[]> {
    return getState().shared_documents.slice();
  },
  async create(data: {
    title: string;
    content: string;
    source_document_id: string | null;
    published_by: string;
  }): Promise<SharedDocument> {
    const s: SharedDocument = {
      id: genId("s"),
      title: data.title,
      content: data.content,
      source_document_id: data.source_document_id,
      published_by: data.published_by,
      created_at: isoNow(),
      updated_at: isoNow(),
    };
    mutate((db) => {
      db.shared_documents.push(s);
    });
    return s;
  },
  async update(id: string, patch: Partial<SharedDocument>): Promise<void> {
    mutate((db) => {
      const idx = db.shared_documents.findIndex((d) => d.id === id);
      if (idx < 0) return;
      db.shared_documents[idx] = { ...db.shared_documents[idx], ...patch, updated_at: isoNow() };
    });
  },
  async remove(id: string): Promise<void> {
    mutate((db) => {
      db.shared_documents = db.shared_documents.filter((d) => d.id !== id);
      db.shared_document_references = db.shared_document_references.filter(
        (r) => r.source_shared_document_id !== id && r.target_shared_document_id !== id,
      );
      db.document_references = db.document_references.filter(
        (r) => !(r.target_scope === "shared" && r.target_document_id === id),
      );
      db.favorites = db.favorites.filter(
        (f) => !(f.document_scope === "shared" && f.document_id === id),
      );
    });
  },
};
