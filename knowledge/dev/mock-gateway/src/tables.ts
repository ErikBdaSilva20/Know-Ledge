// RBAC-routing metadata only — the whitelist of columns a client may send
// per table/operation lives in schemas.ts (Story 6.1/6.3), the single
// source of truth so there's no second list to fall out of sync.
export interface TableConfig {
  // Column stripped from every request body and injected from the session
  // instead (Story 3.1/3.5) — never trust the front for this.
  serverDerivedColumn?: "owner_id" | "published_by";
  // true: `rep` only sees/touches rows where owner_id = session.user.id;
  // manager/admin see/touch all (Story 3.3). false: lookup table — read is
  // open to any authenticated user, write is manager/admin only (Story 3.5).
  ownerVisibility: boolean;
  hasUpdatedAt: boolean;
}

export const TABLES: Record<string, TableConfig> = {
  folders: { serverDerivedColumn: "owner_id", ownerVisibility: true, hasUpdatedAt: true },
  documents: { serverDerivedColumn: "owner_id", ownerVisibility: true, hasUpdatedAt: true },
  document_references: {
    serverDerivedColumn: "owner_id",
    ownerVisibility: true,
    hasUpdatedAt: false,
  },
  favorites: { serverDerivedColumn: "owner_id", ownerVisibility: true, hasUpdatedAt: false },
  shared_documents: {
    serverDerivedColumn: "published_by",
    ownerVisibility: false,
    hasUpdatedAt: true,
  },
  shared_document_references: { ownerVisibility: false, hasUpdatedAt: false },
};
