import type { Database } from "./data/types.gen";

export type Role = "rep" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// Domain types are aliases of the generated schema types (Story 2.5 AC#2) —
// one source of truth, no hand-duplicated shape that can drift from the
// migration.
export type Folder = Database["public"]["Tables"]["folders"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type SharedDocument = Database["public"]["Tables"]["shared_documents"]["Row"];
export type DocumentReference = Database["public"]["Tables"]["document_references"]["Row"];
export type SharedDocumentReference =
  Database["public"]["Tables"]["shared_document_references"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];

export type Scope = "personal" | "shared";
