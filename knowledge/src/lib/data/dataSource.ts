// Lets every repo swap its mock implementation for the gateway one without
// the screens/components that call the repo ever knowing (Story 1.6).
// Default is "mock": until Epic 2 (Neon schema) and Epic 3 (auth/RBAC) land,
// there is no gateway to talk to.
export function isGatewayMode(): boolean {
  return import.meta.env.VITE_DATA_SOURCE === "gateway";
}
