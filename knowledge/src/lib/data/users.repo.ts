import { getState } from "../mockDb";
import { isGatewayMode } from "./dataSource";
import type { User } from "../types";

// Users are NOT a `/data/:table` entity — they come from Better-Auth
// (Importantdoc.md §B8), so this repo hits the gateway's dedicated /api/users
// route instead of going through `db.table`. Mock mode returns the seeded
// users. `client.ts` is protected (it only exposes `db`/`auth`), so the
// gateway call is made here against the same VITE_GATEWAY_URL/VITE_TENANT_ID
// config it uses for local dev.
//
// Any failure degrades to an empty list rather than throwing: the endpoint is
// manager/admin only (a rep gets 403), and the REAL gateway does not implement
// /api/users yet (foundation extension — see AUDITORIA-GERAL-CODIGO-E-ERROS.md
// M6). Callers just show fewer names until that lands.
export const usersRepo = {
  async list(): Promise<User[]> {
    if (!isGatewayMode()) return getState().users.slice();
    try {
      const gatewayUrl = import.meta.env.VITE_GATEWAY_URL ?? "";
      const tenantId = import.meta.env.VITE_TENANT_ID ?? "";
      const res = await fetch(`${gatewayUrl}/api/users`, {
        credentials: "include",
        headers: { "X-Tenant-Id": tenantId },
      });
      if (!res.ok) return [];
      return (await res.json()) as User[];
    } catch {
      return [];
    }
  },
};
