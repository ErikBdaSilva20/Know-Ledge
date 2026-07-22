// Decides whether a browser Origin is an allowed dev origin. Extracted from
// index.ts so it's unit-testable without booting the Hono server.
//
// Accepts ANY localhost / 127.0.0.1 port rather than a single pinned one: Vite
// climbs 5173 -> 5174 -> 5175 when a port is busy, and with credentials the
// browser blocks every request whose Origin isn't echoed back exactly — a
// hard-pinned origin silently breaks the whole app the moment Vite lands on a
// different port. An explicit DEV_ORIGIN (e.g. a non-localhost dev host) is
// honoured as an additional allow.
export function isAllowedDevOrigin(origin: string | undefined, devOrigin?: string): string | null {
  if (!origin) return null;
  if (devOrigin && origin === devOrigin) return origin;
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" ? origin : null;
  } catch {
    return null;
  }
}
