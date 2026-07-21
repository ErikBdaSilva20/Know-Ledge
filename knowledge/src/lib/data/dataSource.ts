// Lets every repo swap its mock implementation for the gateway one without
// the screens/components that call the repo ever knowing (Story 1.6).
// Which one is active is decided entirely by VITE_DATA_SOURCE — set via
// `npm run dev:mock` / `npm run dev:gateway` (see .env.mock / .env.gateway),
// never at runtime. A runtime toggle used to exist here (localStorage-backed)
// but it could get left on and silently redirect every write to the mock
// store instead of the real local gateway with no visible sign why — two
// explicit, restart-required modes replace it.
export function isGatewayMode(): boolean {
  return import.meta.env.VITE_DATA_SOURCE === "gateway";
}
