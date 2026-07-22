# Database

SQL schema/migrations for this app's tenant database (a **Neon** Postgres, one
per tenant — see `doc/architecture/01-stack-e-modelagem.md`).

- `migrations/0001_business_schema.sql` — the single source of truth for the
  business schema (folders, documents, shared_documents, references, favorites).
  It runs on top of the Better-Auth tables (`dev/init-db/00_better_auth.sql` in
  local dev) and references `"user"(id)`.

`src/lib/data/types.gen.ts` mirrors this file — regenerate those types whenever
the migration changes. The local dev harness mounts this file into Postgres via
`dev/docker-compose.yml`.

> Folder named `Database/` (not `supabase/`): the DB is Neon, not Supabase. The
> `supabase/migrations` layout is only a migration-tooling convention; nothing
> here depends on Supabase.
