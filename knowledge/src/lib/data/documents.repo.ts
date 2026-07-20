import { db } from "./client";
import { isGatewayMode } from "./dataSource";
import { genId, getState, isoNow, mutate } from "../mockDb";
import type { Document } from "../types";
import type { Database } from "./types.gen";

const table = db.table<Document>("documents");

type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];

export const documentsRepo = {
  async list(): Promise<Document[]> {
    if (isGatewayMode()) return table.list();
    return getState().documents.slice();
  },
  // owner_id is derived from the session by the gateway — the mock path
  // still needs it explicitly since there is no real session to derive it from.
  async create(data: DocumentInsert & { owner_id: string }): Promise<Document> {
    if (isGatewayMode()) {
      const { owner_id, ...rest } = data;
      return table.create(rest);
    }
    const doc: Document = {
      id: genId("d"),
      owner_id: data.owner_id,
      folder_id: data.folder_id,
      title: data.title,
      content: data.content ?? "",
      created_at: isoNow(),
      updated_at: isoNow(),
    };
    mutate((s) => {
      s.documents.push(doc);
    });
    return doc;
  },
  // Story 6.11 AC#1 — pass `expectedUpdatedAt` (the value last read) to get
  // optimistic concurrency: the gateway 409s if someone else saved first
  // instead of silently overwriting their change. Ignored in mock mode
  // (single in-memory store, nothing to race against).
  async update(
    id: string,
    patch: Partial<Document>,
    opts?: { expectedUpdatedAt?: string },
  ): Promise<Document> {
    if (isGatewayMode()) {
      const body: Partial<Document> & { expected_updated_at?: string } = { ...patch };
      if (opts?.expectedUpdatedAt) body.expected_updated_at = opts.expectedUpdatedAt;
      return table.update(id, body as Partial<Document>);
    }
    let updated: Document | undefined;
    mutate((s) => {
      const idx = s.documents.findIndex((d) => d.id === id);
      if (idx < 0) return;
      s.documents[idx] = { ...s.documents[idx], ...patch, updated_at: isoNow() };
      updated = s.documents[idx];
    });
    if (!updated) throw new Error(`documents/${id} not found`);
    return updated;
  },
  async remove(id: string): Promise<void> {
    if (isGatewayMode()) {
      await table.remove(id);
      return;
    }
    mutate((s) => {
      s.documents = s.documents.filter((d) => d.id !== id);
      s.document_references = s.document_references.filter(
        (r) =>
          r.source_document_id !== id &&
          !(r.target_scope === "personal" && r.target_document_id === id),
      );
      s.favorites = s.favorites.filter(
        (f) => !(f.document_scope === "personal" && f.document_id === id),
      );
    });
  },
};
