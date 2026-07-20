-- Minimal Better-Auth-shaped tables for the LOCAL mock-gateway only.
-- This is NOT the real Better-Auth schema (no account/verification/org
-- tables — this test double doesn't need OAuth or email verification to
-- exercise RBAC) — just enough for email+password sessions and the
-- admin/manager/rep role the app actually reads (Importantdoc.md §B8).
-- Runs BEFORE 01_business_schema.sql (docker-entrypoint-initdb.d runs
-- files in filename order) since owner_id/published_by reference "user"(id)
-- — same ordering rule as production (Story 2.1 AC#6).

create table if not exists "user" (
  id             text primary key,
  name           text not null,
  email          text not null unique,
  password_hash  text not null,
  role           text not null default 'rep' check (role in ('rep', 'manager', 'admin')),
  created_at     timestamptz not null default now()
);

create table if not exists session (
  id          text primary key,
  user_id     text not null references "user"(id) on delete cascade,
  token       text not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_session_token on session(token);
create index if not exists idx_session_user on session(user_id);
