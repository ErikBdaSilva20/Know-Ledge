import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getState } from "./mockDb";
import { auth } from "./data/client";
import { isGatewayMode } from "./data/dataSource";
import type { Role, User } from "./types";

interface SessionCtx {
  user: User | null;
  setUserId: (id: string | null) => void;
  can: (perm: Permission) => boolean;
  // Re-checks auth.me() after a real sign-in/sign-out against the gateway —
  // the mount effect below only runs once, so a fresh login needs this to
  // make `user` reflect the new session without a full page reload.
  refreshGatewaySession: () => Promise<void>;
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

  const refreshGatewaySession = async () => {
    const { user, role } = await auth.me();
    setGatewayUser(user && role ? { ...user, role } : null);
  };

  useEffect(() => {
    if (isGatewayMode()) {
      // Real session hydration (Story 1.6). Runs once on mount to pick up an
      // existing cookie; LoginPage calls refreshGatewaySession() again right
      // after a real sign-in, since this effect only fires once.
      refreshGatewaySession();
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
      refreshGatewaySession,
    };
  }, [userId, gatewayUser]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
