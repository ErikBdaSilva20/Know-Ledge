-- Knowledge Vault — business schema (Importantdoc.md §B4).
-- Idempotent: safe to run more than once (docker/local re-provision, Story 7.1).
--
-- MUST run AFTER the gateway has created its own Better-Auth tables
-- (user, session, account, verification, organization, member, invitation)
-- in this tenant's Neon database — owner_id below references "user"(id).
--
-- Hard rules followed (Importantdoc.md §B4, doc/architecture/01-stack-e-modelagem.md §3):
--   * snake_case only (table + column names match ^[a-z_][a-z0-9_]*$).
--   * owner_id is TEXT, references "user"(id) — never uuid, never auth.users.
--   * NO RLS, NO auth.uid(), NO custom_access_token_hook, NO profiles table.
--     Authorization is 100% in the gateway (app-layer).
--   * No reserved table names (user, session, account, verification,
--     organization, member, invitation) — none of the tables below collide.
--   * timestamptz columns are declared timestamptz(3) (millisecond precision):
--     Postgres's default is microseconds, but JS Date/JSON round-trips only
--     carry milliseconds. Story 6.11's optimistic concurrency compares a
--     client-echoed updated_at against the stored value — at full precision
--     that comparison silently fails on every save (confirmed against a real
--     Postgres, not a hypothetical). Truncating at the column removes the
--     mismatch instead of requiring every comparison site to round.

create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. folders — personal vault organization (owner-written, needs owner_id).
create table if not exists folders (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null references "user"(id) on delete cascade,
  parent_id   uuid references folders(id) on delete cascade,
  name        text not null,
  created_at  timestamptz(3) not null default now(),
  updated_at  timestamptz(3) not null default now()
);
create index if not exists idx_folders_owner on folders(owner_id);
create index if not exists idx_folders_parent on folders(parent_id);

drop trigger if exists trg_folders_touch_updated_at on folders;
create trigger trg_folders_touch_updated_at
  before update on folders
  for each row execute function touch_updated_at();

-- 2. documents — personal vault (Markdown only, no binary/upload — ADR-004).
-- folder_id cascades: deleting a folder deletes the documents inside it,
-- matching the product's "delete folder" warning (doc/architecture §3.2).
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null references "user"(id) on delete cascade,
  folder_id   uuid references folders(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  created_at  timestamptz(3) not null default now(),
  updated_at  timestamptz(3) not null default now()
);
create index if not exists idx_documents_owner on documents(owner_id);
create index if not exists idx_documents_folder on documents(folder_id);

drop trigger if exists trg_documents_touch_updated_at on documents;
create trigger trg_documents_touch_updated_at
  before update on documents
  for each row execute function touch_updated_at();

-- 3. document_references — references inside the personal vault.
-- Child table written by `rep` -> MUST have owner_id (Importantdoc.md §B4.1
-- gotcha: a child table without owner_id 403s the rep on write).
-- target_document_id has no FK: it points at either documents.id (personal)
-- or shared_documents.id (shared) depending on target_scope — a single FK
-- can't express that; integrity is validated app-side (Story 4.2).
create table if not exists document_references (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            text not null references "user"(id) on delete cascade,
  source_document_id  uuid not null references documents(id) on delete cascade,
  target_scope        text not null check (target_scope in ('personal', 'shared')),
  target_document_id  uuid not null,
  created_at          timestamptz(3) not null default now()
);
create index if not exists idx_document_references_owner on document_references(owner_id);
create index if not exists idx_document_references_source on document_references(source_document_id);

-- 4. favorites — same "child needs owner_id" rule as document_references.
create table if not exists favorites (
  id              uuid primary key default gen_random_uuid(),
  owner_id        text not null references "user"(id) on delete cascade,
  document_scope  text not null check (document_scope in ('personal', 'shared')),
  document_id     uuid not null,
  created_at      timestamptz(3) not null default now()
);
create index if not exists idx_favorites_owner on favorites(owner_id);
create unique index if not exists uq_favorites_owner_doc
  on favorites(owner_id, document_scope, document_id);

-- 5. shared_documents — curated knowledge base. Deliberately ownerless:
-- the gateway treats any table without owner_id as a lookup (read: anyone
-- logged in; write: admin/manager only) — that's the whole RBAC story for
-- the shared library, for free, with zero authorization code.
-- published_by is set by the gateway from the session on the Publish route
-- (Story 4.1) — never sent by the front. source_document_id is
-- traceability-only (nullable, no FK): the copy is independent of the
-- original once published.
-- published_by is NOT NULL per Story 2.4 AC#1 — that rules out "on delete
-- set null" (a NOT NULL column can never be nulled by a FK action), so this
-- intentionally leaves the FK at Postgres's default NO ACTION: you can't
-- delete a user who has published shared docs without reassigning them
-- first. That protects the shared library from silently losing authorship
-- instead of the Dev Notes' original "set null" suggestion, which would
-- have violated the NOT NULL constraint.
create table if not exists shared_documents (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  content             text not null default '',
  source_document_id  uuid,
  published_by        text not null references "user"(id),
  created_at          timestamptz(3) not null default now(),
  updated_at          timestamptz(3) not null default now()
);

drop trigger if exists trg_shared_documents_touch_updated_at on shared_documents;
create trigger trg_shared_documents_touch_updated_at
  before update on shared_documents
  for each row execute function touch_updated_at();

-- 6. shared_document_references — a shared document can only reference
-- another shared document (never a personal one, which would dangle for
-- every other user) — enforced here by both FKs pointing at shared_documents.
-- Ownerless, same lookup treatment as shared_documents (write: admin/manager).
create table if not exists shared_document_references (
  id                          uuid primary key default gen_random_uuid(),
  source_shared_document_id  uuid not null references shared_documents(id) on delete cascade,
  target_shared_document_id  uuid not null references shared_documents(id) on delete cascade,
  created_at                  timestamptz(3) not null default now()
);
