import { genId, getState, isoNow, mutate } from "../mockDb";
import type { Folder } from "../types";

export const foldersRepo = {
  async list(): Promise<Folder[]> {
    return getState().folders.slice();
  },
  async create(data: {
    owner_id: string;
    parent_id: string | null;
    name: string;
  }): Promise<Folder> {
    const f: Folder = {
      id: genId("f"),
      owner_id: data.owner_id,
      parent_id: data.parent_id,
      name: data.name,
      created_at: isoNow(),
      updated_at: isoNow(),
    };
    mutate((s) => {
      s.folders.push(f);
    });
    return f;
  },
  async update(id: string, patch: Partial<Folder>): Promise<void> {
    mutate((s) => {
      const idx = s.folders.findIndex((f) => f.id === id);
      if (idx < 0) return;
      s.folders[idx] = { ...s.folders[idx], ...patch, updated_at: isoNow() };
    });
  },
  async remove(id: string): Promise<void> {
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
