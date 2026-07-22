import { db } from "./client";
import type { Document } from "../types";
import type { Database } from "./types.gen";

const table = db.table<Document>("documents");

type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];

export const documentsRepo = {
  async list(): Promise<Document[]> {
    return table.list();
  },
  // owner_id is derived from the session by the gateway — accepted here so
  // callers can pass the owner they know about, but stripped before the
  // request (Importantdoc.md §B5: never send owner_id from the front).
  async create(data: DocumentInsert & { owner_id: string }): Promise<Document> {
    const { owner_id, ...rest } = data;
    return table.create(rest);
  },
  // Story 6.11 AC#1 — pass `expectedUpdatedAt` (the value last read) to get
  // optimistic concurrency: the gateway 409s if someone else saved first
  // instead of silently overwriting their change.
  async update(
    id: string,
    patch: Partial<Document>,
    opts?: { expectedUpdatedAt?: string },
  ): Promise<Document> {
    const body: Partial<Document> & { expected_updated_at?: string } = { ...patch };
    if (opts?.expectedUpdatedAt) body.expected_updated_at = opts.expectedUpdatedAt;
    return table.update(id, body as Partial<Document>);
  },
  async remove(id: string): Promise<void> {
    await table.remove(id);
  },
};
