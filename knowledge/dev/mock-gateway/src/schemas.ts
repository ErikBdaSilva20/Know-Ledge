import { z } from "zod";

// Story 6.5 — centralized limits, not magic numbers scattered across schemas.
// Content cap keeps the "load the whole list, filter in memory" front (no
// server-side pagination, Importantdoc.md §B5) from degrading on one huge doc.
export const LIMITS = {
  NAME_MAX: 200,
  TITLE_MAX: 300,
  CONTENT_MAX: 200_000,
} as const;

const uuid = z.string().uuid();
const name = z.string().trim().min(1).max(LIMITS.NAME_MAX);
const title = z.string().trim().min(1).max(LIMITS.TITLE_MAX);
const content = z.string().max(LIMITS.CONTENT_MAX);
const scope = z.enum(["personal", "shared"]);

// Story 6.11 AC#1 — optimistic concurrency: if the caller sends the
// `updated_at` it last read, the row only updates when it still matches.
// Not a real column — pulled out of the parsed body before it reaches SQL.
const expectedUpdatedAt = z.string().datetime().optional();

// .strict() is what makes this ALSO the whitelist (Story 6.3): any key not
// declared here — including owner_id, published_by, id, created_at,
// updated_at (Story 6.2/6.10) — fails validation instead of being silently
// dropped. Column order for INSERT/UPDATE is derived from these shapes in
// routes/data.ts, so this file is the single source of truth for "what a
// client may send" per table and per operation.
// owner_name / published_by_name: a display-name snapshot the client stamps
// from its own session at create time (see the migration's comment on
// folders.owner_name for why this exists — no generic route can list `user`
// rows). Never accepted on update — a display name is set once, at creation.
export const SCHEMAS = {
  folders: {
    insert: z.object({ parent_id: uuid.nullable(), name, owner_name: name.optional() }).strict(),
    update: z.object({ parent_id: uuid.nullable().optional(), name: name.optional() }).strict(),
  },
  documents: {
    insert: z
      .object({
        folder_id: uuid.nullable(),
        title,
        content: content.optional(),
        owner_name: name.optional(),
      })
      .strict(),
    update: z
      .object({
        folder_id: uuid.nullable().optional(),
        title: title.optional(),
        content: content.optional(),
        expected_updated_at: expectedUpdatedAt,
      })
      .strict(),
  },
  shared_documents: {
    insert: z
      .object({
        title,
        content,
        source_document_id: uuid.nullable(),
        published_by_name: name.optional(),
      })
      .strict(),
    update: z
      .object({
        title: title.optional(),
        content: content.optional(),
        expected_updated_at: expectedUpdatedAt,
      })
      .strict(),
  },
  document_references: {
    insert: z
      .object({ source_document_id: uuid, target_scope: scope, target_document_id: uuid })
      .strict(),
    // Never updated (the app only creates/removes references) — an empty
    // shape still rejects any body that tries.
    update: z.object({}).strict(),
  },
  shared_document_references: {
    insert: z.object({ source_shared_document_id: uuid, target_shared_document_id: uuid }).strict(),
    update: z.object({}).strict(),
  },
  favorites: {
    insert: z.object({ document_scope: scope, document_id: uuid }).strict(),
    update: z.object({}).strict(),
  },
} as const;

export type KnownTable = keyof typeof SCHEMAS;

export function isKnownTable(name: string): name is KnownTable {
  return Object.prototype.hasOwnProperty.call(SCHEMAS, name);
}

export function isUuid(value: string): boolean {
  return uuid.safeParse(value).success;
}
