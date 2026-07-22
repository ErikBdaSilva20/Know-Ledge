import { db } from "./client";
import type { DocumentReference } from "../types";
import type { Database } from "./types.gen";

const table = db.table<DocumentReference>("document_references");

type DocumentReferenceInsert = Database["public"]["Tables"]["document_references"]["Insert"];

export const documentReferencesRepo = {
  async list(): Promise<DocumentReference[]> {
    return table.list();
  },
  // owner_id is derived from the session by the gateway (Importantdoc.md §B5).
  async create(data: DocumentReferenceInsert & { owner_id: string }): Promise<DocumentReference> {
    const { owner_id, ...rest } = data;
    return table.create(rest);
  },
  async remove(id: string): Promise<void> {
    await table.remove(id);
  },
};
