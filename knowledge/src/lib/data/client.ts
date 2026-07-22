// PROTECTED — contract with the tenant-gateway (Importantdoc.md §B5, §B7, §B11).
// Never edited by AI or by hand during normal feature work; inherited from the
// masi-ai-orquestration scaffold. Repos (`*.repo.ts`) are the only consumers.

import type { Role } from "../types";
import { DomainError, domainErrorFromResponse, networkDomainError } from "./errors";

export interface Session {
  user: { id: string; name: string; email: string } | null;
  role: Role | null;
}

interface GatewayConfig {
  gatewayUrl: string;
  tenantId: string;
}

function readQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function resolveConfig(): GatewayConfig {
  const gatewayUrl =
    readQueryParam("gw") ?? import.meta.env.VITE_GATEWAY_URL ?? window.__MASI_GW__ ?? "";
  const tenantId =
    readQueryParam("t") ?? import.meta.env.VITE_TENANT_ID ?? window.__MASI_TENANT__ ?? "";
  return { gatewayUrl, tenantId };
}

function isPreview(): boolean {
  return typeof window !== "undefined" && Boolean(window.__MASI_PREVIEW__);
}

/** In-preview fixtures injected by the Sandpack editor, keyed by table name. */
function previewTable<R>(name: string): R[] {
  const fixtures = window.__MASI_PREVIEW_FIXTURES__ ?? {};
  return (fixtures[name] as R[] | undefined) ?? [];
}

// Story 5.5 AC#2 — a hung request must fail, not spin forever.
const REQUEST_TIMEOUT_MS = 10_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Every failure funnels through here as a DomainError (Story 5.1 AC#3/#4) —
// callers (repos) never see a Response, a fetch exception, or a status code.
async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { gatewayUrl, tenantId } = resolveConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${gatewayUrl}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": tenantId,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw networkDomainError("A requisição demorou demais. Tente de novo.");
    }
    throw networkDomainError("Não foi possível falar com o servidor.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const requestId = res.headers.get("X-Request-Id") ?? undefined;
    let message = `${method} ${path} failed with ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.error?.message === "string") message = data.error.message;
    } catch {
      // Body wasn't JSON (or was empty) — fall back to the generic message above.
    }
    throw domainErrorFromResponse(res.status, message, requestId);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const db = {
  table<R = unknown>(name: string) {
    return {
      // Story 5.5 AC#6 — retry once on a transport-level failure (network
      // drop, 5xx). GET is idempotent, so this is always safe; create/update/
      // remove below never retry — a retried POST could duplicate data.
      list: async (): Promise<R[]> => {
        if (isPreview()) return previewTable<R>(name);
        try {
          return await api<R[]>("GET", `/data/${name}`);
        } catch (err) {
          if (err instanceof DomainError && err.type === "unexpected") {
            await sleep(300);
            return api<R[]>("GET", `/data/${name}`);
          }
          throw err;
        }
      },
      create: (input: Partial<R>): Promise<R> => api<R>("POST", `/data/${name}`, input),
      update: (id: string, patch: Partial<R>): Promise<R> =>
        api<R>("PATCH", `/data/${name}/${id}`, patch),
      remove: (id: string): Promise<void> => api<void>("DELETE", `/data/${name}/${id}`),
    };
  },
};

// Better-Auth REST surface (default routes). `role` comes from the tenant's
// membership record; the gateway is the source of truth — this value is UI-only
// (Importantdoc.md §B8, doc/architecture/03-seguranca-zero-trust.md §2). Never
// gate a network call on `role`/`can()` — only use it to hide/show UI.
export const auth = {
  async me(): Promise<Session> {
    if (isPreview()) return { user: null, role: null };
    const { gatewayUrl, tenantId } = resolveConfig();
    const res = await fetch(`${gatewayUrl}/api/auth/get-session`, {
      credentials: "include",
      headers: { "X-Tenant-Id": tenantId },
    });
    if (!res.ok) return { user: null, role: null };
    const data = await res.json();
    if (!data?.user) return { user: null, role: null };
    return { user: data.user, role: data.user.role ?? null };
  },
  async signIn(email: string, password: string): Promise<void> {
    await api("POST", "/api/auth/sign-in/email", { email, password });
  },
  async signUp(name: string, email: string, password: string): Promise<void> {
    await api("POST", "/api/auth/sign-up/email", { name, email, password });
  },
  async signOut(): Promise<void> {
    await api("POST", "/api/auth/sign-out", {});
  },
};
