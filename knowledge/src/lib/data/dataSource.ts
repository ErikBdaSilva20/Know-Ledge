// This branch (demo/mock-preview) is a dedicated public demo deploy — it must
// NEVER call a real backend, no matter what env vars the hosting platform
// does or doesn't set correctly. Hardcoded false, not env-driven, on purpose:
// an env var misconfigured on Vercel is exactly what caused "Não foi possível
// falar com o servidor" popups here before. See dataSource.ts on the main app
// branch for the real (env-driven) version of this function.
export function isGatewayMode(): boolean {
  return false;
}
