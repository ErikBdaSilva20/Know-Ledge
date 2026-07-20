import { db } from "./client";
import { isGatewayMode } from "./dataSource";
import { genId, getState, isoNow, mutate } from "../mockDb";
import type { Document } from "../types";

const table = db.table<Document>("documents");

export const documentsRepo = {
  async list(): Promise<Document[]> {
    if (isGatewayMode()) return table.list();
    return getState().documents.slice();
  },
  async create(data: Partial<Document> & { owner_id: string; title: string }): Promise<Document> {
    if (isGatewayMode()) {
      // owner_id is derived from the session by the gateway — never sent by the front.
      const { owner_id, ...rest } = data;
      return table.create(rest);
    }
    const doc: Document = {
      id: genId("d"),
      owner_id: data.owner_id,
      folder_id: data.folder_id ?? null,
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
  async update(id: string, patch: Partial<Document>): Promise<void> {
    if (isGatewayMode()) {
      await table.update(id, patch);
      return;
    }
    mutate((s) => {
      const idx = s.documents.findIndex((d) => d.id === id);
      if (idx < 0) return;
      s.documents[idx] = { ...s.documents[idx], ...patch, updated_at: isoNow() };
    });
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
