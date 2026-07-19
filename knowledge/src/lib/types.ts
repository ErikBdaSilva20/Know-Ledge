export type Role = "rep" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Folder {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  owner_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SharedDocument {
  id: string;
  title: string;
  content: string;
  source_document_id: string | null;
  published_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentReference {
  id: string;
  owner_id: string;
  source_document_id: string;
  target_scope: "personal" | "shared";
  target_document_id: string;
  created_at: string;
}

export interface SharedDocumentReference {
  id: string;
  source_shared_document_id: string;
  target_shared_document_id: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  owner_id: string;
  document_scope: "personal" | "shared";
  document_id: string;
  created_at: string;
}

export type Scope = "personal" | "shared";
