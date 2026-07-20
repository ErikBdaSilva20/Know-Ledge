/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL: string;
  readonly VITE_TENANT_ID?: string;
  readonly VITE_DATA_SOURCE?: "mock" | "gateway";
}

interface Window {
  /** Gateway base URL injected by the edge worker at runtime (production). */
  __MASI_GW__?: string;
  /** Tenant id injected by the edge worker at runtime (production). */
  __MASI_TENANT__?: string;
  /** True when running inside the MasIA Sandpack editor preview. */
  __MASI_PREVIEW__?: boolean;
  /** Fixtures injected by the Sandpack preview, keyed by table name. */
  __MASI_PREVIEW_FIXTURES__?: Record<string, unknown[]>;
}
