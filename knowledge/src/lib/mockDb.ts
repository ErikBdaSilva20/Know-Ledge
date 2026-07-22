import type {
  Document,
  DocumentReference,
  Favorite,
  Folder,
  SharedDocument,
  SharedDocumentReference,
  User,
} from "./types";
import {
  mockDocumentReferences,
  mockDocuments,
  mockFavorites,
  mockFolders,
  mockSharedDocumentReferences,
  mockSharedDocuments,
  mockUsers,
} from "../mock/data";

const STORAGE_KEY = "kv:db:v1";

export interface DbState {
  users: User[];
  folders: Folder[];
  documents: Document[];
  shared_documents: SharedDocument[];
  document_references: DocumentReference[];
  shared_document_references: SharedDocumentReference[];
  favorites: Favorite[];
}

const listeners = new Set<() => void>();

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

// Full content (folders/documents/shared docs/references/favorites) lives in
// src/mock/data.ts — a dedicated folder so the mocked-deploy dataset (people
// reviewing VITE_DATA_SOURCE=mock builds, e.g. on Vercel) is one place to
// read or extend, separate from this file's plumbing. Real accounts against
// the gateway are unaffected (dev/mock-gateway/seed.ts's Postgres seed is
// what that path uses). session.tsx's mock login always resolves to "u_carla".
function seed(): DbState {
  return {
    users: [...mockUsers],
    folders: [...mockFolders],
    documents: [...mockDocuments],
    shared_documents: [...mockSharedDocuments],
    document_references: [...mockDocumentReferences],
    shared_document_references: [...mockSharedDocumentReferences],
    favorites: [...mockFavorites],
  };
}

let state: DbState;

// Plain client-side SPA — no SSR, so `window` always exists here.
function load(): DbState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DbState;
  } catch {
    // fall through
  }
  const s = seed();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}

function persist() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getState(): DbState {
  if (!state) state = load();
  return state;
}

export function setState(next: DbState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function mutate(fn: (draft: DbState) => void) {
  const s = getState();
  const draft: DbState = JSON.parse(JSON.stringify(s));
  fn(draft);
  setState(draft);
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const genId = uid;
export const isoNow = nowIso;
