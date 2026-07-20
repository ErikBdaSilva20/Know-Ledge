// Mirrors knowledge/supabase/migrations/0001_business_schema.sql — the RBAC
// shape this file encodes is exactly doc/architecture/03-seguranca-zero-trust.md.
export interface TableConfig {
  insertable: string[];
  updatable: string[];
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
  folders: {
    insertable: ["parent_id", "name"],
    updatable: ["parent_id", "name"],
    serverDerivedColumn: "owner_id",
    ownerVisibility: true,
    hasUpdatedAt: true,
  },
  documents: {
    insertable: ["folder_id", "title", "content"],
    updatable: ["folder_id", "title", "content"],
    serverDerivedColumn: "owner_id",
    ownerVisibility: true,
    hasUpdatedAt: true,
  },
  document_references: {
    insertable: ["source_document_id", "target_scope", "target_document_id"],
    updatable: [],
    serverDerivedColumn: "owner_id",
    ownerVisibility: true,
    hasUpdatedAt: false,
  },
  favorites: {
    insertable: ["document_scope", "document_id"],
    updatable: [],
    serverDerivedColumn: "owner_id",
    ownerVisibility: true,
    hasUpdatedAt: false,
  },
  shared_documents: {
    insertable: ["title", "content", "source_document_id"],
    updatable: ["title", "content"],
    serverDerivedColumn: "published_by",
    ownerVisibility: false,
    hasUpdatedAt: true,
  },
  shared_document_references: {
    insertable: ["source_shared_document_id", "target_shared_document_id"],
    updatable: [],
    ownerVisibility: false,
    hasUpdatedAt: false,
  },
};

export function isKnownTable(name: string): name is keyof typeof TABLES {
  return Object.prototype.hasOwnProperty.call(TABLES, name);
}
