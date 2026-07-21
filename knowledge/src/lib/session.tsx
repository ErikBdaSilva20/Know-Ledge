import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getState } from "./mockDb";
import { auth } from "./data/client";
import { isGatewayMode } from "./data/dataSource";
import type { Role, User } from "./types";

interface SessionCtx {
  user: User | null;
  // Mock mode only: flips the `kv:logado` flag and re-derives `user` from it.
  // No profile picker anymore — logging in "as" someone in mock mode always
  // resolves to this fixed user (see MOCK_USER_ID below).
  setLoggedIn: (loggedIn: boolean) => void;
  can: (perm: Permission) => boolean;
  // Re-checks auth.me() after a real sign-in against the gateway — the mount
  // effect below only runs once, so a fresh login needs this to make `user`
  // reflect the new session without a full page reload.
  refreshGatewaySession: () => Promise<void>;
  // Logs out regardless of mode: gateway mode calls the real auth.signOut()
  // (clears the httpOnly cookie); mock mode just clears the local flag.
  logout: () => Promise<void>;
}

type Permission = "seeAllDocs" | "publishShared" | "editShared" | "admin";

const Ctx = createContext<SessionCtx | null>(null);
const LOGGED_IN_KEY = "kv:logado";
// Points at mockDb.ts's seeded admin (Carla Dias) so owner/publisher name
// lookups elsewhere (Explorer, shared docs, etc.) resolve to a real name
// instead of an orphaned id, and admin gives full visibility for exploring.
const MOCK_USER_ID = "u_carla";

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
  const [loggedIn, setLoggedInState] = useState(false);
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
      setLoggedInState(localStorage.getItem(LOGGED_IN_KEY) === "true");
    } catch {
      // ignore
    }
  }, []);

  const setLoggedIn = (next: boolean) => {
    if (isGatewayMode()) return; // driven by auth.me(), not this flag
    setLoggedInState(next);
    try {
      if (next) localStorage.setItem(LOGGED_IN_KEY, "true");
      else localStorage.removeItem(LOGGED_IN_KEY);
    } catch {
      // ignore
    }
  };

  const logout = async () => {
    if (isGatewayMode()) {
      await auth.signOut();
      setGatewayUser(null);
    } else {
      setLoggedIn(false);
    }
  };

  const value = useMemo<SessionCtx>(() => {
    const user = isGatewayMode()
      ? gatewayUser
      : loggedIn
        ? (getState().users.find((u) => u.id === MOCK_USER_ID) ?? null)
        : null;
    const perms = user ? permsFor(user.role) : new Set<Permission>();
    return {
      user,
      setLoggedIn,
      can: (p) => perms.has(p),
      refreshGatewaySession,
      logout,
    };
  }, [loggedIn, gatewayUser]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
