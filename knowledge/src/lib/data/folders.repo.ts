import { db } from "./client";
import type { Folder } from "../types";
import type { Database } from "./types.gen";

const table = db.table<Folder>("folders");

type FolderInsert = Database["public"]["Tables"]["folders"]["Insert"];

export const foldersRepo = {
  async list(): Promise<Folder[]> {
    return table.list();
  },
  // owner_id is derived from the session by the gateway (Importantdoc.md §B5).
  async create(data: FolderInsert & { owner_id: string }): Promise<Folder> {
    const { owner_id, ...rest } = data;
    return table.create(rest);
  },
  async update(id: string, patch: Partial<Folder>): Promise<void> {
    await table.update(id, patch);
  },
  // The gateway cascades subfolders/documents on delete in Neon via ON DELETE
  // (see the business schema migration), so no client-side recursive cleanup.
  async remove(id: string): Promise<void> {
    await table.remove(id);
  },
};
