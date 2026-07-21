import type {
  Document,
  DocumentReference,
  Favorite,
  Folder,
  SharedDocument,
  SharedDocumentReference,
  User,
} from "./types";

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

// Sample folders/documents/shared docs were emptied out once manual testing
// moved to real accounts against the gateway (dev/mock-gateway/seed.ts's
// Postgres seed is the one still in use for that). The 4 users stay — other
// screens (Explorer, shared docs, admin) still resolve owner/publisher names
// against this list, and session.tsx's mock login resolves to "u_carla".
function seed(): DbState {
  const users: User[] = [
    { id: "u_ana", name: "Ana Silva", email: "ana@empresa.com", role: "rep" },
    { id: "u_bruno", name: "Bruno Costa", email: "bruno@empresa.com", role: "manager" },
    { id: "u_carla", name: "Carla Dias", email: "carla@empresa.com", role: "admin" },
    { id: "u_diego", name: "Diego Reis", email: "diego@empresa.com", role: "rep" },
  ];
  const folders: Folder[] = [];
  const documents: Document[] = [];
  const shared_documents: SharedDocument[] = [];
  const shared_document_references: SharedDocumentReference[] = [];

  return {
    users,
    folders,
    documents,
    shared_documents,
    document_references: [],
    shared_document_references,
    favorites: [],
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
