import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getState } from "./mockDb";
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUserIdState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const setUserId = (id: string | null) => {
    setUserIdState(id);
    try {
      if (id) localStorage.setItem(SESSION_KEY, JSON.stringify(id));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const value = useMemo<SessionCtx>(() => {
    const user = userId ? (getState().users.find((u) => u.id === userId) ?? null) : null;
    const perms = user ? permsFor(user.role) : new Set<Permission>();
    return {
      user,
      setUserId,
      can: (p) => perms.has(p),
    };
  }, [userId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
