import { toast } from "sonner";
import type { NavigateFunction } from "react-router-dom";
import { DomainError, isSessionExpired } from "./data/errors";

// Story 5.2 AC#4 — the status->action map screens should follow: an expired
// session redirects to login, everything else just surfaces the domain
// error's already-friendly message as a toast.
export function handleDomainError(err: unknown, navigate?: NavigateFunction) {
  if (isSessionExpired(err)) {
    if (navigate) navigate("/login", { replace: true });
    else window.location.assign("/login");
    return;
  }
  toast.error(err instanceof DomainError ? err.message : "Algo deu errado. Tente novamente.");
}
