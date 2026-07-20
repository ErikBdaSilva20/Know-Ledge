import { db } from "./client";
import { isGatewayMode } from "./dataSource";
import { genId, getState, isoNow, mutate } from "../mockDb";
import type { DocumentReference } from "../types";
import type { Database } from "./types.gen";

const table = db.table<DocumentReference>("document_references");

type DocumentReferenceInsert = Database["public"]["Tables"]["document_references"]["Insert"];

export const documentReferencesRepo = {
  async list(): Promise<DocumentReference[]> {
    if (isGatewayMode()) return table.list();
    return getState().document_references.slice();
  },
  async create(data: DocumentReferenceInsert & { owner_id: string }): Promise<DocumentReference> {
    if (isGatewayMode()) {
      const { owner_id, ...rest } = data;
      return table.create(rest);
    }
    const r: DocumentReference = { ...data, id: genId("r"), created_at: isoNow() };
    mutate((s) => {
      s.document_references.push(r);
    });
    return r;
  },
  async remove(id: string): Promise<void> {
    if (isGatewayMode()) {
      await table.remove(id);
      return;
    }
    mutate((s) => {
      s.document_references = s.document_references.filter((r) => r.id !== id);
    });
  },
};
