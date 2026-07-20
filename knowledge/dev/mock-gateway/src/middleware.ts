import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { getSessionUser } from "./auth.js";
import { ApiError } from "./errors.js";

export const SESSION_COOKIE = "kv_session";

export async function requireAuth(c: Context, next: Next) {
  const token = getCookie(c, SESSION_COOKIE);
  const user = await getSessionUser(token);
  if (!user) throw new ApiError(401, "unauthorized", "No active session");
  c.set("user", user);
  await next();
}

// Story 6.9 (validação de tenant): the mock-gateway is single-tenant, but
// still requires a matching X-Tenant-Id header so the negative test case
// ("X-Tenant-Id de outro tenant -> negado") is reproducible locally.
export async function requireTenant(c: Context, next: Next) {
  const tenantId = c.req.header("X-Tenant-Id");
  const expected = process.env.TENANT_ID ?? "local-dev";
  if (!tenantId || tenantId !== expected) {
    throw new ApiError(403, "invalid_tenant", "Unknown or missing X-Tenant-Id");
  }
  await next();
}
