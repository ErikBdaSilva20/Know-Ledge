// PROTECTED — contract with the tenant-gateway (Importantdoc.md §B5, §B7, §B11).
// Never edited by AI or by hand during normal feature work; inherited from the
// masi-ai-orquestration scaffold. Repos (`*.repo.ts`) are the only consumers.

import type { Role } from "../types";

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

export class GatewayError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { gatewayUrl, tenantId } = resolveConfig();
  const res = await fetch(`${gatewayUrl}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new GatewayError(`${method} ${path} failed with ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const db = {
  table<R = unknown>(name: string) {
    return {
      list: (): Promise<R[]> => {
        if (isPreview()) return Promise.resolve(previewTable<R>(name));
        return api<R[]>("GET", `/data/${name}`);
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
// (Importantdoc.md §B8).
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
