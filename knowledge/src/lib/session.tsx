import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, type Session } from "./data/client";
import { withTimeout } from "./withTimeout";
import type { Role, User } from "./types";

interface SessionCtx {
  user: User | null;
  // True only until the initial gateway session probe (auth.me) settles. Lets
  // RequireAuth hold off redirecting to /login until we actually know whether
  // a valid cookie exists — otherwise every refresh flashes the login screen
  // before the session resolves.
  sessionLoading: boolean;
  can: (perm: Permission) => boolean;
  // Re-checks auth.me() after a real sign-in — the mount effect below only
  // runs once, so a fresh login needs this to make `user` reflect the new
  // session without a full page reload.
  refreshGatewaySession: () => Promise<void>;
  // Clears the httpOnly session cookie server-side (best-effort) and the local
  // user client-side.
  logout: () => Promise<void>;
}

type Permission = "seeAllDocs" | "publishShared" | "editShared" | "admin";

const Ctx = createContext<SessionCtx | null>(null);
// A session probe should never hang the whole app on a dead/slow gateway —
// past this, treat the session as "not signed in" and move on. Mirrors the
// request timeout the gateway client already uses for /data calls.
const SESSION_PROBE_TIMEOUT_MS = 10_000;
const NO_SESSION: Session = { user: null, role: null };

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
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const refreshGatewaySession = async () => {
    // withTimeout guarantees a resolved value even if the gateway is down,
    // slow, or answers with a non-JSON error body — auth.me() otherwise
    // throws a raw fetch error (it has no try/catch of its own), which as an
    // unawaited call would surface as an unhandled rejection and leave the
    // user stuck signed-out with no feedback.
    const { user: probed, role } = await withTimeout(
      () => auth.me(),
      SESSION_PROBE_TIMEOUT_MS,
      NO_SESSION,
    );
    setUser(probed && role ? { ...probed, role } : null);
  };

  useEffect(() => {
    // Real session hydration (Story 1.6). Runs once on mount to pick up an
    // existing cookie; LoginPage calls refreshGatewaySession() again right
    // after a real sign-in, since this effect only fires once.
    refreshGatewaySession().finally(() => setSessionLoading(false));
  }, []);

  const logout = async () => {
    // Best-effort server-side, definitive client-side: clear the local user
    // even if signOut fails (network down, cookie already gone), so the
    // button never silently does nothing and leaves the user "signed in".
    try {
      await auth.signOut();
    } catch {
      // ignore — the local clear below is what the user actually sees.
    }
    setUser(null);
  };

  const value = useMemo<SessionCtx>(() => {
    const perms = user ? permsFor(user.role) : new Set<Permission>();
    return {
      user,
      sessionLoading,
      can: (p) => perms.has(p),
      refreshGatewaySession,
      logout,
    };
  }, [user, sessionLoading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
