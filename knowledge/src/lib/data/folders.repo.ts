import { db } from "./client";
import { isGatewayMode } from "./dataSource";
import { genId, getState, isoNow, mutate } from "../mockDb";
import type { Folder } from "../types";
import type { Database } from "./types.gen";

const table = db.table<Folder>("folders");

type FolderInsert = Database["public"]["Tables"]["folders"]["Insert"];

export const foldersRepo = {
  async list(): Promise<Folder[]> {
    if (isGatewayMode()) return table.list();
    return getState().folders.slice();
  },
  async create(data: FolderInsert & { owner_id: string }): Promise<Folder> {
    if (isGatewayMode()) {
      const { owner_id, ...rest } = data;
      return table.create(rest);
    }
    const f: Folder = {
      id: genId("f"),
      owner_id: data.owner_id,
      parent_id: data.parent_id,
      name: data.name,
      owner_name: data.owner_name ?? null,
      created_at: isoNow(),
      updated_at: isoNow(),
    };
    mutate((s) => {
      s.folders.push(f);
    });
    return f;
  },
  async update(id: string, patch: Partial<Folder>): Promise<void> {
    if (isGatewayMode()) {
      await table.update(id, patch);
      return;
    }
    mutate((s) => {
      const idx = s.folders.findIndex((f) => f.id === id);
      if (idx < 0) return;
      s.folders[idx] = { ...s.folders[idx], ...patch, updated_at: isoNow() };
    });
  },
  async remove(id: string): Promise<void> {
    if (isGatewayMode()) {
      // The gateway has no cascade-on-delete for folders; mirror the mock's
      // recursive cleanup client-side once Epic 2 ships the FK constraints
      // (subfolders/documents already cascade in Neon via ON DELETE — see
      // doc/architecture/01-stack-e-modelagem.md §3.1/§3.2).
      await table.remove(id);
      return;
    }
    mutate((s) => {
      // recursively remove folder + subfolders + documents in them
      const toRemove = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of s.folders) {
          if (f.parent_id && toRemove.has(f.parent_id) && !toRemove.has(f.id)) {
            toRemove.add(f.id);
            changed = true;
          }
        }
      }
      const removedDocs = s.documents
        .filter((d) => d.folder_id && toRemove.has(d.folder_id))
        .map((d) => d.id);
      s.folders = s.folders.filter((f) => !toRemove.has(f.id));
      s.documents = s.documents.filter((d) => !d.folder_id || !toRemove.has(d.folder_id));
      s.document_references = s.document_references.filter(
        (r) =>
          !removedDocs.includes(r.source_document_id) &&
          !(r.target_scope === "personal" && removedDocs.includes(r.target_document_id)),
      );
      s.favorites = s.favorites.filter(
        (fav) => !(fav.document_scope === "personal" && removedDocs.includes(fav.document_id)),
      );
    });
  },
};
