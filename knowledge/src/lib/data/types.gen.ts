// GENERATED — do not edit by hand.
// Mirrors the Neon schema defined in doc/architecture/01-stack-e-modelagem.md §3.
// Regenerate once the Epic 2 migrations (supabase/migrations/0001_business_schema.sql) land.

export interface Database {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string;
          owner_id: string;
          parent_id: string | null;
          name: string;
          created_at: string;
          updated_at: string;
        };
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          folder_id: string | null;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
      };
      shared_documents: {
        Row: {
          id: string;
          title: string;
          content: string;
          source_document_id: string | null;
          published_by: string;
          created_at: string;
          updated_at: string;
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
      };
      shared_document_references: {
        Row: {
          id: string;
          source_shared_document_id: string;
          target_shared_document_id: string;
          created_at: string;
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
      };
    };
  };
}
