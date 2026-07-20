import crypto from "node:crypto";
import { pool } from "./db.js";

export type Role = "rep" | "manager" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(hash, "hex");
  return expected.length === check.length && crypto.timingSafeEqual(expected, check);
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    `insert into session (id, user_id, token, expires_at) values ($1, $2, $3, $4)`,
    [crypto.randomUUID(), userId, token, expiresAt],
  );
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await pool.query(`delete from session where token = $1`, [token]);
}

export async function getSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const res = await pool.query<SessionUser>(
    `select u.id, u.name, u.email, u.role
       from session s
       join "user" u on u.id = s.user_id
      where s.token = $1 and s.expires_at > now()`,
    [token],
  );
  return res.rows[0] ?? null;
}
