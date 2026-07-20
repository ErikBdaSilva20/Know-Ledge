import { db } from "./client";
import { isGatewayMode } from "./dataSource";
import { genId, getState, isoNow, mutate } from "../mockDb";
import type { SharedDocumentReference } from "../types";
import type { Database } from "./types.gen";

const table = db.table<SharedDocumentReference>("shared_document_references");

type SharedDocumentReferenceInsert =
  Database["public"]["Tables"]["shared_document_references"]["Insert"];

export const sharedDocumentReferencesRepo = {
  async list(): Promise<SharedDocumentReference[]> {
    if (isGatewayMode()) return table.list();
    return getState().shared_document_references.slice();
  },
  async create(data: SharedDocumentReferenceInsert): Promise<SharedDocumentReference> {
    if (isGatewayMode()) return table.create(data);
    const r: SharedDocumentReference = { ...data, id: genId("sr"), created_at: isoNow() };
    mutate((s) => {
      s.shared_document_references.push(r);
    });
    return r;
  },
  async remove(id: string): Promise<void> {
    if (isGatewayMode()) {
      await table.remove(id);
      return;
    }
    mutate((s) => {
      s.shared_document_references = s.shared_document_references.filter((r) => r.id !== id);
    });
  },
};
