// GENERATED — do not edit by hand.
// Mirrors knowledge/supabase/migrations/0001_business_schema.sql (Story 2.5).
// Regenerate whenever that migration changes.
//
// `Insert` omits every column the gateway derives server-side (id, owner_id,
// published_by, created_at, updated_at) — repos ask callers for exactly the
// fields the front is actually allowed to provide.

export interface Database {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string;
          owner_id: string;
          parent_id: string | null;
          name: string;
          owner_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          parent_id: string | null;
          name: string;
          owner_name?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          folder_id: string | null;
          title: string;
          content: string;
          owner_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          folder_id: string | null;
          title: string;
          content?: string;
          owner_name?: string;
        };
      };
      shared_documents: {
        Row: {
          id: string;
          title: string;
          content: string;
          source_document_id: string | null;
          published_by: string;
          published_by_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          content: string;
          source_document_id: string | null;
          published_by_name?: string;
        };
      };
      document_references: {
        Row: {
          id: string;
          owner_id: string;
          source_document_id: string;
          target_scope: "personal" | "shared";
          target_document_id: string;
          created_at: string;
        };
        Insert: {
          source_document_id: string;
          target_scope: "personal" | "shared";
          target_document_id: string;
        };
      };
      shared_document_references: {
        Row: {
          id: string;
          source_shared_document_id: string;
          target_shared_document_id: string;
          created_at: string;
        };
        Insert: {
          source_shared_document_id: string;
          target_shared_document_id: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          owner_id: string;
          document_scope: "personal" | "shared";
          document_id: string;
          created_at: string;
        };
        Insert: {
          document_scope: "personal" | "shared";
          document_id: string;
        };
      };
    };
  };
}
