import { Hono, type Context } from "hono";
import { pool } from "../db.js";
import { ApiError } from "../errors.js";
import { isKnownTable, TABLES } from "../tables.js";
import { requireAuth, requireTenant } from "../middleware.js";
import type { SessionUser } from "../auth.js";

type Env = { Variables: { user: SessionUser } };

export const dataRoutes = new Hono<Env>();

dataRoutes.use("*", requireTenant, requireAuth);

async function parseBody(c: Context): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new ApiError(400, "invalid_body", "Request body must be valid JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(400, "invalid_body", "Request body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

// Story 4.2 — the FK on document_references.target_document_id can't exist
// (it's polymorphic: personal -> documents, shared -> shared_documents), so
// the cross-scope rules are enforced here instead: a personal target must
// belong to the SAME owner (a link can't point at someone else's private
// doc — Story 4.2 AC#1); a shared target must exist (AC#2).
async function validateReferenceTarget(
  targetScope: unknown,
  targetDocumentId: unknown,
  ownerId: string,
) {
  if (targetScope !== "personal" && targetScope !== "shared") {
    throw new ApiError(400, "invalid_body", "target_scope must be 'personal' or 'shared'");
  }
  if (typeof targetDocumentId !== "string" || targetDocumentId.length === 0) {
    throw new ApiError(400, "invalid_body", "target_document_id is required");
  }
  const res =
    targetScope === "personal"
      ? await pool.query(`select 1 from documents where id = $1 and owner_id = $2`, [
          targetDocumentId,
          ownerId,
        ])
      : await pool.query(`select 1 from shared_documents where id = $1`, [targetDocumentId]);
  if (res.rowCount === 0) {
    throw new ApiError(404, "not_found", `Reference target ${targetScope}/${targetDocumentId} not found`);
  }
}

function pickColumns(body: Record<string, unknown>, allowed: string[]) {
  const cols: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (key in body) {
      cols.push(key);
      values.push(body[key]);
    }
  }
  return { cols, values };
}

// GET /data/:table — list, filtered server-side by ownership (Story 3.3).
dataRoutes.get("/:table", async (c) => {
  const table = c.req.param("table");
  if (!isKnownTable(table)) throw new ApiError(400, "unknown_table", `Unknown table: ${table}`);
  const config = TABLES[table];
  const user = c.get("user");

  const res =
    config.ownerVisibility && user.role === "rep"
      ? await pool.query(`select * from ${table} where owner_id = $1 order by created_at desc`, [
          user.id,
        ])
      : await pool.query(`select * from ${table} order by created_at desc`);

  return c.json(res.rows);
});

// POST /data/:table — create. owner_id/published_by are ALWAYS server-set
// from the session (Story 3.1) — any value the client sends for that column
// is silently dropped, never merged.
dataRoutes.post("/:table", async (c) => {
  const table = c.req.param("table");
  if (!isKnownTable(table)) throw new ApiError(400, "unknown_table", `Unknown table: ${table}`);
  const config = TABLES[table];
  const user = c.get("user");

  if (!config.ownerVisibility && user.role === "rep") {
    throw new ApiError(403, "forbidden", `Only manager/admin can write to ${table}`);
  }

  const body = await parseBody(c);

  if (table === "document_references") {
    await validateReferenceTarget(body.target_scope, body.target_document_id, user.id);
  }

  const { cols, values } = pickColumns(body, config.insertable);
  if (config.serverDerivedColumn) {
    cols.push(config.serverDerivedColumn);
    values.push(user.id);
  }
  if (cols.length === 0) throw new ApiError(400, "invalid_body", "No insertable fields provided");

  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const res = await pool.query(
    `insert into ${table} (${cols.join(", ")}) values (${placeholders}) returning *`,
    values,
  );
  return c.json(res.rows[0], 201);
});

// PATCH /data/:table/:id — update. Ownership is enforced INSIDE the SQL
// WHERE clause (atomic, no separate existence check) so a `rep` touching
// someone else's row and a `rep` touching a nonexistent id get the exact
// same 404 — no enumeration oracle (Story 3.4 AC#6).
dataRoutes.patch("/:table/:id", async (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");
  if (!isKnownTable(table)) throw new ApiError(400, "unknown_table", `Unknown table: ${table}`);
  const config = TABLES[table];
  const user = c.get("user");

  if (!config.ownerVisibility && user.role === "rep") {
    throw new ApiError(403, "forbidden", `Only manager/admin can write to ${table}`);
  }

  const body = await parseBody(c);
  const { cols, values } = pickColumns(body, config.updatable);
  if (cols.length === 0) throw new ApiError(400, "invalid_body", "Nothing to update");
  if (config.hasUpdatedAt) cols.push("updated_at");

  const setClause = cols
    .map((col, i) => (col === "updated_at" ? `updated_at = now()` : `${col} = $${i + 1}`))
    .join(", ");

  const restrictToOwner = config.ownerVisibility && user.role === "rep";
  const whereClause = restrictToOwner
    ? `where id = $${values.length + 1} and owner_id = $${values.length + 2}`
    : `where id = $${values.length + 1}`;
  const whereValues = restrictToOwner ? [id, user.id] : [id];

  const res = await pool.query(
    `update ${table} set ${setClause} ${whereClause} returning *`,
    [...values, ...whereValues],
  );
  if (res.rowCount === 0) throw new ApiError(404, "not_found", `${table}/${id} not found`);
  return c.json(res.rows[0]);
});

// DELETE /data/:table/:id — same atomic ownership gate as PATCH.
dataRoutes.delete("/:table/:id", async (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");
  if (!isKnownTable(table)) throw new ApiError(400, "unknown_table", `Unknown table: ${table}`);
  const config = TABLES[table];
  const user = c.get("user");

  if (!config.ownerVisibility && user.role === "rep") {
    throw new ApiError(403, "forbidden", `Only manager/admin can write to ${table}`);
  }

  const restrictToOwner = config.ownerVisibility && user.role === "rep";
  const res = restrictToOwner
    ? await pool.query(`delete from ${table} where id = $1 and owner_id = $2 returning id`, [
        id,
        user.id,
      ])
    : await pool.query(`delete from ${table} where id = $1 returning id`, [id]);

  if (res.rowCount === 0) throw new ApiError(404, "not_found", `${table}/${id} not found`);
  return c.body(null, 204);
});
