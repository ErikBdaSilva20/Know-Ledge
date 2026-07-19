import { genId, getState, isoNow, mutate } from "../mockDb";
import type { DocumentReference, SharedDocumentReference } from "../types";

export const personalReferencesRepo = {
  async list(): Promise<DocumentReference[]> {
    return getState().document_references.slice();
  },
  async create(data: Omit<DocumentReference, "id" | "created_at">): Promise<DocumentReference> {
    const r: DocumentReference = { ...data, id: genId("r"), created_at: isoNow() };
    mutate((s) => {
      s.document_references.push(r);
    });
    return r;
  },
  async update(): Promise<void> {
    // not used
  },
  async remove(id: string): Promise<void> {
    mutate((s) => {
      s.document_references = s.document_references.filter((r) => r.id !== id);
    });
  },
};

export const sharedReferencesRepo = {
  async list(): Promise<SharedDocumentReference[]> {
    return getState().shared_document_references.slice();
  },
  async create(
    data: Omit<SharedDocumentReference, "id" | "created_at">,
  ): Promise<SharedDocumentReference> {
    const r: SharedDocumentReference = { ...data, id: genId("sr"), created_at: isoNow() };
    mutate((s) => {
      s.shared_document_references.push(r);
    });
    return r;
  },
  async update(): Promise<void> {},
  async remove(id: string): Promise<void> {
    mutate((s) => {
      s.shared_document_references = s.shared_document_references.filter((r) => r.id !== id);
    });
  },
};
