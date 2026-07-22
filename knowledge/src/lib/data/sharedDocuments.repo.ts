import { db } from "./client";
import type { Document, SharedDocument } from "../types";
import type { Database } from "./types.gen";

const table = db.table<SharedDocument>("shared_documents");

type SharedDocumentInsert = Database["public"]["Tables"]["shared_documents"]["Insert"];

export const sharedDocumentsRepo = {
  async list(): Promise<SharedDocument[]> {
    return table.list();
  },
  // published_by is derived from the session by the gateway (Story 3.1).
  async create(data: SharedDocumentInsert & { published_by: string }): Promise<SharedDocument> {
    const { published_by, ...rest } = data;
    return table.create(rest);
  },
  // Publish a personal document into the Base Compartilhada. Goes through the
  // generic create() above (POST /data/shared_documents): shared_documents is
  // configured server-side with `serverDerivedColumn: "published_by"` (never
  // trusts the client) and `ownerVisibility: false` (only manager/admin can
  // write). What it does NOT give is idempotency on a double-submit;
  // PublishToSharedButton's disable-while-publishing covers the common
  // single-tab double-click, but a genuine race across tabs/devices could
  // still create two copies — an accepted, documented tradeoff.
  async publish(
    source: Pick<Document, "id" | "title" | "content">,
    publishedBy: string,
    publishedByName?: string,
  ): Promise<SharedDocument> {
    return sharedDocumentsRepo.create({
      title: source.title,
      content: source.content,
      source_document_id: source.id,
      published_by: publishedBy,
      published_by_name: publishedByName,
    });
  },
  // Story 6.11 AC#1 — see documents.repo.ts's update() for why `opts` exists.
  async update(
    id: string,
    patch: Partial<SharedDocument>,
    opts?: { expectedUpdatedAt?: string },
  ): Promise<SharedDocument> {
    const body: Partial<SharedDocument> & { expected_updated_at?: string } = { ...patch };
    if (opts?.expectedUpdatedAt) body.expected_updated_at = opts.expectedUpdatedAt;
    return table.update(id, body as Partial<SharedDocument>);
  },
  async remove(id: string): Promise<void> {
    await table.remove(id);
  },
};
