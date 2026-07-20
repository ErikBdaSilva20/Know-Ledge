import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ApiError, errorBody } from "./errors.js";
import { authRoutes } from "./routes/authRoutes.js";
import { dataRoutes } from "./routes/data.js";
import { publishRoutes } from "./routes/publish.js";

const app = new Hono();

// Local-only CORS: the real gateway never uses a wildcard origin in
// production (Story 7.4 AC#6) — this only exists so the Vite dev server can
// hit localhost with credentials.
app.use(
  "*",
  cors({
    origin: process.env.DEV_ORIGIN ?? "http://localhost:5173",
    credentials: true,
    allowHeaders: ["Content-Type", "X-Tenant-Id"],
  }),
);

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json(errorBody(err), err.status);
  }
  console.error(err);
  return c.json(errorBody(new ApiError(500, "internal_error", "Unexpected error")), 500);
});

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);
app.route("/data", dataRoutes);
app.route("/shared", publishRoutes);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`kv-mock-gateway listening on http://localhost:${info.port}`);
});
