import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ApiError, errorBody, translatePgError } from "./errors.js";
import { accessLog, requestId } from "./logging.js";
import { authRoutes } from "./routes/authRoutes.js";
import { dataRoutes } from "./routes/data.js";
import { publishRoutes } from "./routes/publish.js";
import type { SessionUser } from "./auth.js";

type Env = { Variables: { requestId: string; user?: SessionUser } };

const app = new Hono<Env>();

app.use("*", requestId, accessLog);

// Local-only CORS: the real gateway never uses a wildcard origin in
// production (Story 7.4 AC#6) — this only exists so the Vite dev server can
// hit localhost with credentials.
app.use(
  "*",
  cors({
    origin: process.env.DEV_ORIGIN ?? "http://localhost:5173",
    credentials: true,
    allowHeaders: ["Content-Type", "X-Tenant-Id", "Idempotency-Key"],
  }),
);

app.onError((err, c) => {
  const id = c.get("requestId") ?? "unknown";

  if (err instanceof ApiError) {
    return c.json(errorBody(err, id), err.status);
  }

  const pgError = translatePgError(err);
  if (pgError) {
    return c.json(errorBody(pgError, id), pgError.status);
  }

  // Story 5.3 AC#4 — the stack stays on the server; the client gets a
  // friendly message plus the request_id to report it by.
  console.error(
    JSON.stringify({ request_id: id, error: String(err), stack: (err as Error)?.stack }),
  );
  return c.json(errorBody(new ApiError(500, "internal_error", "Unexpected error"), id), 500);
});

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);
app.route("/data", dataRoutes);
app.route("/shared", publishRoutes);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`kv-mock-gateway listening on http://localhost:${info.port}`);
});
