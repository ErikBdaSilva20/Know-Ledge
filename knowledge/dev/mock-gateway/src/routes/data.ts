import { Hono, type Context } from "hono";
import { pool } from "../db.js";
import { ApiError } from "../errors.js";
import { isKnownTable, isUuid, SCHEMAS } from "../schemas.js";
import { TABLES } from "../tables.js";
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

// Story 6.6 — `parent_id`/`folder_id` must exist AND belong to the same
// owner (a rep can't nest into someone else's folder). Not expressible as a
// plain FK, so it's validated here, same pattern as document_references.
async function assertOwnedFolder(folderId: string | null, ownerId: string) {
  if (folderId === null) return;
  const res = await pool.query(`select 1 from folders where id = $1 and owner_id = $2`, [
    folderId,
    ownerId,
  ]);
  if (res.rowCount === 0) throw new ApiError(404, "not_found", `folders/${folderId} not found`);
}

// Story 4.2 / 6.6 — a personal target must belong to the SAME owner; a
// shared target just needs to exist (it's visible to everyone).
async function assertReferenceTarget(
  targetScope: "personal" | "shared",
  targetDocumentId: string,
  ownerId: string,
) {
  const res =
    targetScope === "personal"
      ? await pool.query(`select 1 from documents where id = $1 and owner_id = $2`, [
          targetDocumentId,
          ownerId,
        ])
      : await pool.query(`select 1 from shared_documents where id = $1`, [targetDocumentId]);
  if (res.rowCount === 0) {
    throw new ApiError(
      404,
      "not_found",
      `Reference target ${targetScope}/${targetDocumentId} not found`,
    );
  }
}

async function assertFavoriteTarget(
  documentScope: "personal" | "shared",
  documentId: string,
  ownerId: string,
) {
  const res =
    documentScope === "personal"
      ? await pool.query(`select 1 from documents where id = $1 and owner_id = $2`, [
          documentId,
          ownerId,
        ])
      : await pool.query(`select 1 from shared_documents where id = $1`, [documentId]);
  if (res.rowCount === 0) {
    throw new ApiError(
      404,
      "not_found",
      `Favorite target ${documentScope}/${documentId} not found`,
    );
  }
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

// POST /data/:table — create. Schema validation (Story 6.1) is `.strict()`,
// so it doubles as the field whitelist (Story 6.3) AND the owner_id/
// published_by rejection (Story 6.2) — none of those are declared fields,
// so sending them is a 400, not a silent drop.
dataRoutes.post("/:table", async (c) => {
  const table = c.req.param("table");
  if (!isKnownTable(table)) throw new ApiError(400, "unknown_table", `Unknown table: ${table}`);
  const config = TABLES[table];
  const user = c.get("user");

  if (!config.ownerVisibility && user.role === "rep") {
    throw new ApiError(403, "forbidden", `Only manager/admin can write to ${table}`);
  }

  const body = await parseBody(c);
  const parsed = SCHEMAS[table].insert.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid body");
  }
  const data = parsed.data as Record<string, unknown>;

  if (table === "folders") await assertOwnedFolder(data.parent_id as string | null, user.id);
  if (table === "documents") await assertOwnedFolder(data.folder_id as string | null, user.id);
  if (table === "document_references") {
    await assertReferenceTarget(
      data.target_scope as "personal" | "shared",
      data.target_document_id as string,
      user.id,
    );
  }
  if (table === "favorites") {
    await assertFavoriteTarget(
      data.document_scope as "personal" | "shared",
      data.document_id as string,
      user.id,
    );
  }

  const cols = Object.keys(data);
  const values = Object.values(data);
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
  if (!isUuid(id)) throw new ApiError(400, "invalid_id", "id must be a UUID"); // Story 6.10
  const config = TABLES[table];
  const user = c.get("user");

  if (!config.ownerVisibility && user.role === "rep") {
    throw new ApiError(403, "forbidden", `Only manager/admin can write to ${table}`);
  }

  const body = await parseBody(c);
  const parsed = SCHEMAS[table].update.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid body");
  }
  // expected_updated_at is a concurrency control (Story 6.11 AC#1), not a column.
  const { expected_updated_at, ...columns } = parsed.data as Record<string, unknown>;

  if (table === "documents" && "folder_id" in columns) {
    await assertOwnedFolder(columns.folder_id as string | null, user.id);
  }

  const cols = Object.keys(columns);
  const values = Object.values(columns);
  if (cols.length === 0) throw new ApiError(400, "invalid_body", "Nothing to update");
  if (config.hasUpdatedAt) cols.push("updated_at");

  const setClause = cols
    .map((col, i) => (col === "updated_at" ? `updated_at = now()` : `${col} = $${i + 1}`))
    .join(", ");

  const restrictToOwner = config.ownerVisibility && user.role === "rep";
  const conditions = [`id = $${values.length + 1}`];
  const whereValues: unknown[] = [id];
  if (restrictToOwner) {
    conditions.push(`owner_id = $${values.length + whereValues.length + 1}`);
    whereValues.push(user.id);
  }
  if (typeof expected_updated_at === "string") {
    conditions.push(`updated_at = $${values.length + whereValues.length + 1}`);
    whereValues.push(expected_updated_at);
  }

  const res = await pool.query(
    `update ${table} set ${setClause} where ${conditions.join(" and ")} returning *`,
    [...values, ...whereValues],
  );
  if (res.rowCount === 0) {
    // Distinguish "someone else edited it first" (409) from "not found/not
    // yours" (404) only when a version was supplied — otherwise the two are
    // indistinguishable by design (Story 3.4 AC#6).
    if (typeof expected_updated_at === "string") {
      const stillExists = restrictToOwner
        ? await pool.query(`select 1 from ${table} where id = $1 and owner_id = $2`, [id, user.id])
        : await pool.query(`select 1 from ${table} where id = $1`, [id]);
      if ((stillExists.rowCount ?? 0) > 0) {
        throw new ApiError(409, "conflict", "This item was changed elsewhere. Reload and retry.");
      }
    }
    throw new ApiError(404, "not_found", `${table}/${id} not found`);
  }
  return c.json(res.rows[0]);
});

// DELETE /data/:table/:id — same atomic ownership gate as PATCH.
dataRoutes.delete("/:table/:id", async (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");
  if (!isKnownTable(table)) throw new ApiError(400, "unknown_table", `Unknown table: ${table}`);
  if (!isUuid(id)) throw new ApiError(400, "invalid_id", "id must be a UUID"); // Story 6.10
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
