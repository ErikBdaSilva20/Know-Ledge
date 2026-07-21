import { db } from "./client";
import { isGatewayMode } from "./dataSource";
import { domainErrorFromResponse, networkDomainError } from "./errors";
import { genId, getState, isoNow, mutate } from "../mockDb";
import type { SharedDocument } from "../types";
import type { Database } from "./types.gen";

const table = db.table<SharedDocument>("shared_documents");

type SharedDocumentInsert = Database["public"]["Tables"]["shared_documents"]["Insert"];

export const sharedDocumentsRepo = {
  async list(): Promise<SharedDocument[]> {
    if (isGatewayMode()) return table.list();
    return getState().shared_documents.slice();
  },
  async create(data: SharedDocumentInsert & { published_by: string }): Promise<SharedDocument> {
    if (isGatewayMode()) {
      // published_by is derived from the session by the gateway (Story 3.1).
      const { published_by, ...rest } = data;
      return table.create(rest);
    }
    const s: SharedDocument = {
      id: genId("s"),
      title: data.title,
      content: data.content,
      source_document_id: data.source_document_id,
      published_by: data.published_by,
      created_at: isoNow(),
      updated_at: isoNow(),
    };
    mutate((db) => {
      db.shared_documents.push(s);
    });
    return s;
  },
  // POST /shared/publish (Story 4.1) — the dedicated, idempotent publish route.
  // Unlike create() above (generic /data/shared_documents, no idempotency, so a
  // double-submit duplicates — audit finding M5), this sends an Idempotency-Key
  // and lets the gateway derive published_by from the session and copy
  // title/content from the source server-side. client.ts is PROTECTED and only
  // speaks /data/:table, so — like usersRepo — this calls the route directly.
  async publish(sourceDocumentId: string, publishedBy: string): Promise<SharedDocument> {
    if (!isGatewayMode()) {
      const src = getState().documents.find((d) => d.id === sourceDocumentId);
      if (!src) throw new Error(`documents/${sourceDocumentId} not found`);
      return sharedDocumentsRepo.create({
        title: src.title,
        content: src.content,
        source_document_id: src.id,
        published_by: publishedBy,
      });
    }
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL ?? "";
    const tenantId = import.meta.env.VITE_TENANT_ID ?? "";
    let res: Response;
    try {
      res = await fetch(`${gatewayUrl}/shared/publish`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": tenantId,
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ source_document_id: sourceDocumentId }),
      });
    } catch {
      throw networkDomainError("Não foi possível falar com o servidor.");
    }
    if (!res.ok) {
      const requestId = res.headers.get("X-Request-Id") ?? undefined;
      let message = `POST /shared/publish failed with ${res.status}`;
      try {
        const data = await res.json();
        if (typeof data?.error?.message === "string") message = data.error.message;
      } catch {
        // non-JSON body — keep the generic message
      }
      throw domainErrorFromResponse(res.status, message, requestId);
    }
    return (await res.json()) as SharedDocument;
  },
  // Story 6.11 AC#1 — see documents.repo.ts's update() for why `opts` exists.
  async update(
    id: string,
    patch: Partial<SharedDocument>,
    opts?: { expectedUpdatedAt?: string },
  ): Promise<SharedDocument> {
    if (isGatewayMode()) {
      const body: Partial<SharedDocument> & { expected_updated_at?: string } = { ...patch };
      if (opts?.expectedUpdatedAt) body.expected_updated_at = opts.expectedUpdatedAt;
      return table.update(id, body as Partial<SharedDocument>);
    }
    let updated: SharedDocument | undefined;
    mutate((db) => {
      const idx = db.shared_documents.findIndex((d) => d.id === id);
      if (idx < 0) return;
      db.shared_documents[idx] = { ...db.shared_documents[idx], ...patch, updated_at: isoNow() };
      updated = db.shared_documents[idx];
    });
    if (!updated) throw new Error(`shared_documents/${id} not found`);
    return updated;
  },
  async remove(id: string): Promise<void> {
    if (isGatewayMode()) {
      await table.remove(id);
      return;
    }
    mutate((db) => {
      db.shared_documents = db.shared_documents.filter((d) => d.id !== id);
      db.shared_document_references = db.shared_document_references.filter(
        (r) => r.source_shared_document_id !== id && r.target_shared_document_id !== id,
      );
      db.document_references = db.document_references.filter(
        (r) => !(r.target_scope === "shared" && r.target_document_id === id),
      );
      db.favorites = db.favorites.filter(
        (f) => !(f.document_scope === "shared" && f.document_id === id),
      );
    });
  },
};
