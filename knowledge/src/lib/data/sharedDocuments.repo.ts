import { db } from "./client";
import { isGatewayMode } from "./dataSource";
import { genId, getState, isoNow, mutate } from "../mockDb";
import type { SharedDocument } from "../types";
import type { Database } from "./types.gen";

const table = db.table<SharedDocument>("shared_documents");

type SharedDocumentInsert = Database["public"]["Tables"]["shared_documents"]["Insert"];

export const sharedDocumentsRepo = {
  async list(): Promise<SharedDocument[]> {
    if (isGatewayMode()) return table.list();
    return getState().shared_documents.slice();
  },
  async create(data: SharedDocumentInsert & { published_by: string }): Promise<SharedDocument> {
    if (isGatewayMode()) {
      // published_by is derived from the session by the gateway (Story 3.1).
      const { published_by, ...rest } = data;
      return table.create(rest);
    }
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
    if (isGatewayMode()) {
      await table.update(id, patch);
      return;
    }
    mutate((db) => {
      const idx = db.shared_documents.findIndex((d) => d.id === id);
      if (idx < 0) return;
      db.shared_documents[idx] = { ...db.shared_documents[idx], ...patch, updated_at: isoNow() };
    });
  },
  async remove(id: string): Promise<void> {
    if (isGatewayMode()) {
      await table.remove(id);
      return;
    }
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
