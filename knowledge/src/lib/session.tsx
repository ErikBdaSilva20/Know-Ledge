import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getState } from "./mockDb";
import { auth } from "./data/client";
import { isGatewayMode } from "./data/dataSource";
import type { Role, User } from "./types";

interface SessionCtx {
  user: User | null;
  setUserId: (id: string | null) => void;
  can: (perm: Permission) => boolean;
}

type Permission = "seeAllDocs" | "publishShared" | "editShared" | "admin";

const Ctx = createContext<SessionCtx | null>(null);
const SESSION_KEY = "kv:session:v1";

function permsFor(role: Role): Set<Permission> {
  switch (role) {
    case "admin":
      return new Set(["seeAllDocs", "publishShared", "editShared", "admin"]);
    case "manager":
      return new Set(["seeAllDocs", "publishShared", "editShared"]);
    case "rep":
    default:
      return new Set();
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [gatewayUser, setGatewayUser] = useState<User | null>(null);

  useEffect(() => {
    if (isGatewayMode()) {
      // Real session hydration (Story 1.6 AC#4). There is no real login form
      // yet (LoginPage is still the mock role picker) — this only recognizes
      // a session that already exists (e.g. a cookie set by the gateway).
      auth.me().then(({ user, role }) => {
        if (user && role) setGatewayUser({ ...user, role });
      });
      return;
    }
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUserIdState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const setUserId = (id: string | null) => {
    if (isGatewayMode()) return; // driven by auth.me(), not the mock picker
    setUserIdState(id);
    try {
      if (id) localStorage.setItem(SESSION_KEY, JSON.stringify(id));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const value = useMemo<SessionCtx>(() => {
    const user = isGatewayMode()
      ? gatewayUser
      : userId
        ? (getState().users.find((u) => u.id === userId) ?? null)
        : null;
    const perms = user ? permsFor(user.role) : new Set<Permission>();
    return {
      user,
      setUserId,
      can: (p) => perms.has(p),
    };
  }, [userId, gatewayUser]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
