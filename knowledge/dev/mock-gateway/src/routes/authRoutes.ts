import crypto from "node:crypto";
import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { pool } from "../db.js";
import { ApiError } from "../errors.js";
import { createSession, destroySession, getSessionUser, hashPassword, verifyPassword } from "../auth.js";
import { SESSION_COOKIE } from "../middleware.js";

export const authRoutes = new Hono();

const SEVEN_DAYS_S = 7 * 24 * 60 * 60;

function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SEVEN_DAYS_S,
  });
}

async function readCredentials(c: Context) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new ApiError(400, "invalid_body", "Request body must be valid JSON");
  }
  return (body ?? {}) as Record<string, unknown>;
}

// Simplified email+password auth — NOT the real Better-Auth. It exists only
// to give the local mock-gateway a session so RBAC (role/owner_id) has
// something to derive from. Importantdoc.md §B8: "1st user of the tenant
// becomes admin, everyone else joins as rep" — reproduced here.
authRoutes.post("/sign-up/email", async (c) => {
  const { name, email, password } = await readCredentials(c);
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    throw new ApiError(400, "invalid_body", "name, email and password are required");
  }

  const existing = await pool.query(`select id from "user" where email = $1`, [email]);
  if ((existing.rowCount ?? 0) > 0) {
    throw new ApiError(409, "conflict", "Email already registered");
  }

  const countRes = await pool.query<{ n: number }>(`select count(*)::int as n from "user"`);
  const role = countRes.rows[0].n === 0 ? "admin" : "rep";

  const id = crypto.randomUUID();
  await pool.query(
    `insert into "user" (id, name, email, password_hash, role) values ($1, $2, $3, $4, $5)`,
    [id, name, email, hashPassword(password), role],
  );

  const { token } = await createSession(id);
  setSessionCookie(c, token);
  return c.json({ user: { id, name, email, role } }, 201);
});

authRoutes.post("/sign-in/email", async (c) => {
  const { email, password } = await readCredentials(c);
  if (typeof email !== "string" || typeof password !== "string") {
    throw new ApiError(400, "invalid_body", "email and password are required");
  }

  const res = await pool.query(
    `select id, name, email, role, password_hash from "user" where email = $1`,
    [email],
  );
  const row = res.rows[0];
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new ApiError(401, "invalid_credentials", "Invalid email or password");
  }

  const { token } = await createSession(row.id);
  setSessionCookie(c, token);
  return c.json({ user: { id: row.id, name: row.name, email: row.email, role: row.role } });
});

authRoutes.post("/sign-out", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await destroySession(token);
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.body(null, 204);
});

authRoutes.get("/get-session", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  const user = await getSessionUser(token);
  return c.json({ user });
});
