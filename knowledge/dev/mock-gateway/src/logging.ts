import crypto from "node:crypto";
import type { Context, Next } from "hono";

export const REQUEST_ID_HEADER = "X-Request-Id";

// Story 5.3 — every request gets a correlation-id, generated here (the
// boundary), threaded through the error envelope (Story 5.1 AC#6) and the
// access log below, so a user-reported failure and a log line can be tied
// together without ever needing to log anything sensitive.
export async function requestId(c: Context, next: Next) {
  const id = crypto.randomUUID();
  c.set("requestId", id);
  c.header(REQUEST_ID_HEADER, id);
  await next();
}

// Structured (JSON) access log. Deliberately narrow field list — never the
// request/response body, never a cookie/token/password (Story 5.3 AC#3).
export async function accessLog(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const durationMs = Date.now() - start;
  const user = c.get("user") as { role?: string } | undefined;
  console.log(
    JSON.stringify({
      request_id: c.get("requestId"),
      method: c.req.method,
      route: c.req.path,
      status: c.res.status,
      role: user?.role ?? null,
      tenant: c.req.header("X-Tenant-Id") ?? null,
      duration_ms: durationMs,
    }),
  );
}
