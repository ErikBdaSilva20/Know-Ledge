// Lets every repo swap its mock implementation for the gateway one without
// the screens/components that call the repo ever knowing (Story 1.6).
// Default is "mock": until Epic 2 (Neon schema) and Epic 3 (auth/RBAC) land,
// there is no gateway to talk to.
const DEV_PREVIEW_KEY = "kv:devPreviewMock:v1";

// Dev-only escape hatch: lets someone on a real gateway build flip the whole
// app (login, session, every repo) back into mock mode at runtime, to eyeball
// the rep/manager/admin screens without juggling .env.local + a rebuild.
// Gated on import.meta.env.DEV so it's dead-code-eliminated from prod builds.
export function isDevPreviewActive(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem(DEV_PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDevPreviewActive(active: boolean): void {
  try {
    if (active) localStorage.setItem(DEV_PREVIEW_KEY, "1");
    else localStorage.removeItem(DEV_PREVIEW_KEY);
  } catch {
    // ignore
  }
}

export function isGatewayMode(): boolean {
  if (isDevPreviewActive()) return false;
  return import.meta.env.VITE_DATA_SOURCE === "gateway";
}
