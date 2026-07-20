import { Hono, type Context } from "hono";
import { pool } from "../db.js";
import { ApiError } from "../errors.js";
import { requireAuth, requireTenant } from "../middleware.js";
import { getCached, setCached } from "../idempotency.js";
import type { SessionUser } from "../auth.js";

type Env = { Variables: { user: SessionUser } };

export const publishRoutes = new Hono<Env>();

publishRoutes.use("*", requireTenant, requireAuth);

// POST /shared/publish — Story 4.1. This is the one operation the generic
// /data/:table mode cannot express: it reads a `document` that may belong
// to a DIFFERENT user (cross-owner, allowed only for manager/admin), copies
// it into an independent `shared_documents` row, and sets `published_by`
// from the session — never from the client.
publishRoutes.post("/publish", async (c: Context) => {
  const user = c.get("user");
  if (user.role === "rep") {
    throw new ApiError(403, "forbidden", "Only manager/admin can publish");
  }

  // Story 5.5 AC#3 — double-clicking "Publicar" (auto-save + click race, or
  // just an impatient click) must not create two shared_documents. Scoped by
  // key alone: good enough for a dev harness, a real gateway would scope by
  // (user, key) too.
  const idempotencyKey = c.req.header("Idempotency-Key");
  if (idempotencyKey) {
    const cached = getCached(idempotencyKey);
    if (cached) return c.json(cached.body, cached.status as 201);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new ApiError(400, "invalid_body", "Request body must be valid JSON");
  }
  const sourceDocumentId = (body as Record<string, unknown> | null)?.source_document_id;
  if (typeof sourceDocumentId !== "string" || sourceDocumentId.length === 0) {
    throw new ApiError(400, "invalid_body", "source_document_id is required");
  }

  const source = await pool.query<{ id: string; title: string; content: string }>(
    `select id, title, content from documents where id = $1`,
    [sourceDocumentId],
  );
  if (source.rowCount === 0) {
    throw new ApiError(404, "not_found", `document/${sourceDocumentId} not found`);
  }
  const doc = source.rows[0];

  const inserted = await pool.query(
    `insert into shared_documents (title, content, source_document_id, published_by)
     values ($1, $2, $3, $4) returning *`,
    [doc.title, doc.content, doc.id, user.id],
  );
  const result = inserted.rows[0];
  if (idempotencyKey) setCached(idempotencyKey, 201, result);
  return c.json(result, 201);
});
