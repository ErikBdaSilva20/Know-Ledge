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

function seed(): DbState {
  const users: User[] = [
    { id: "u_ana", name: "Ana Silva", email: "ana@empresa.com", role: "rep" },
    { id: "u_bruno", name: "Bruno Costa", email: "bruno@empresa.com", role: "manager" },
    { id: "u_carla", name: "Carla Dias", email: "carla@empresa.com", role: "admin" },
    { id: "u_diego", name: "Diego Reis", email: "diego@empresa.com", role: "rep" },
  ];

  const t = nowIso();
  const folders: Folder[] = [
    {
      id: "f_ana_1",
      owner_id: "u_ana",
      parent_id: null,
      name: "Projetos",
      created_at: t,
      updated_at: t,
    },
    {
      id: "f_ana_2",
      owner_id: "u_ana",
      parent_id: "f_ana_1",
      name: "Cliente Acme",
      created_at: t,
      updated_at: t,
    },
    {
      id: "f_ana_3",
      owner_id: "u_ana",
      parent_id: null,
      name: "Notas",
      created_at: t,
      updated_at: t,
    },
    {
      id: "f_bruno_1",
      owner_id: "u_bruno",
      parent_id: null,
      name: "Gestão",
      created_at: t,
      updated_at: t,
    },
    {
      id: "f_diego_1",
      owner_id: "u_diego",
      parent_id: null,
      name: "Pesquisa",
      created_at: t,
      updated_at: t,
    },
  ];

  const documents: Document[] = [
    {
      id: "d_ana_1",
      owner_id: "u_ana",
      folder_id: "f_ana_2",
      title: "Kickoff Acme",
      content:
        "# Kickoff Acme\n\nReunião inicial com o cliente. Ver também [[Processo de Onboarding|s_1]] e [[Métricas Trimestrais|s_2]].\n\n- Definir escopo\n- Cronograma\n- Riscos",
      created_at: t,
      updated_at: t,
    },
    {
      id: "d_ana_2",
      owner_id: "u_ana",
      folder_id: "f_ana_3",
      title: "Ideias soltas",
      content:
        "# Ideias\n\nAlgumas ideias para explorar depois. Relacionado a [[Kickoff Acme|d_ana_1]].",
      created_at: t,
      updated_at: t,
    },
    {
      id: "d_bruno_1",
      owner_id: "u_bruno",
      folder_id: "f_bruno_1",
      title: "Plano trimestral",
      content:
        "# Plano trimestral\n\nMetas do time para o trimestre. Ver [[Métricas Trimestrais|s_2]].",
      created_at: t,
      updated_at: t,
    },
    {
      id: "d_diego_1",
      owner_id: "u_diego",
      folder_id: "f_diego_1",
      title: "Pesquisa de mercado",
      content: "# Pesquisa\n\nAnálise competitiva do setor.",
      created_at: t,
      updated_at: t,
    },
  ];

  const shared_documents: SharedDocument[] = [
    {
      id: "s_1",
      title: "Processo de Onboarding",
      content:
        "# Processo de Onboarding\n\nGuia oficial para novos membros. Ver [[Métricas Trimestrais|s_2]] para acompanhar progresso.",
      source_document_id: null,
      published_by: "u_carla",
      created_at: t,
      updated_at: t,
    },
    {
      id: "s_2",
      title: "Métricas Trimestrais",
      content: "# Métricas Trimestrais\n\nKPIs oficiais do trimestre.",
      source_document_id: null,
      published_by: "u_bruno",
      created_at: t,
      updated_at: t,
    },
    {
      id: "s_3",
      title: "Política de Segurança",
      content: "# Segurança\n\nBoas práticas obrigatórias.",
      source_document_id: null,
      published_by: "u_carla",
      created_at: t,
      updated_at: t,
    },
  ];

  const shared_document_references: SharedDocumentReference[] = [
    {
      id: uid("sr"),
      source_shared_document_id: "s_1",
      target_shared_document_id: "s_2",
      created_at: t,
    },
  ];

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

export function resetDb() {
  window.localStorage.removeItem(STORAGE_KEY);
  state = seed();
  persist();
  listeners.forEach((l) => l());
}

export const genId = uid;
export const isoNow = nowIso;
