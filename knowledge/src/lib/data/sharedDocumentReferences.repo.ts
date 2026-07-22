import { db } from "./client";
import type { SharedDocumentReference } from "../types";
import type { Database } from "./types.gen";

const table = db.table<SharedDocumentReference>("shared_document_references");

type SharedDocumentReferenceInsert =
  Database["public"]["Tables"]["shared_document_references"]["Insert"];

export const sharedDocumentReferencesRepo = {
  async list(): Promise<SharedDocumentReference[]> {
    return table.list();
  },
  async create(data: SharedDocumentReferenceInsert): Promise<SharedDocumentReference> {
    return table.create(data);
  },
  async remove(id: string): Promise<void> {
    await table.remove(id);
  },
};
