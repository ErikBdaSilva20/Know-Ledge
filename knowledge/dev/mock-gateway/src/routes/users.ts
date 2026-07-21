import { Hono } from "hono";
import { pool } from "../db.js";
import { ApiError } from "../errors.js";
import { requireAuth, requireTenant } from "../middleware.js";
import type { SessionUser } from "../auth.js";

type Env = { Variables: { user: SessionUser } };

export const usersRoutes = new Hono<Env>();

usersRoutes.use("*", requireTenant, requireAuth);

// GET /api/users — the registered-user roster for the admin screen (owner
// filter, "Usuários" tab, owner/publisher name resolution). Users are NOT a
// /data/:table entity (Importantdoc.md §B8: reserved auth table), so they get
// a dedicated route. Manager/admin only — same gate as the admin screen; a
// rep never needs the full roster.
usersRoutes.get("/", async (c) => {
  const user = c.get("user");
  if (user.role === "rep") {
    throw new ApiError(403, "forbidden", "Only manager/admin can list users");
  }
  const res = await pool.query(`select id, name, email, role from "user" order by name`);
  return c.json(res.rows);
});
