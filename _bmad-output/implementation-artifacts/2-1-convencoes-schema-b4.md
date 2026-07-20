---
baseline_commit: 2ef89e5
---

# Story 2.1: Convenções de schema §B4 (a parte mais importante — seguir à risca)

Status: done

## Story

As a **engenheiro escrevendo a migration do Neon**,
I want **as convenções obrigatórias do §B4 aplicadas a toda tabela do Knowledge Vault**,
so that **o modo genérico do gateway sirva as tabelas automaticamente e nada quebre por nome/tipo errado**.

## Acceptance Criteria

1. Toda tabela usa **`snake_case` minúsculo** em tabela e colunas — o regex do modo genérico só aceita `^[a-z_][a-z0-9_]*$`. [Source: Importantdoc.md#B4]
2. Toda tabela tem **`id uuid primary key default gen_random_uuid()`** e (recomendado) `created_at`/`updated_at timestamptz not null default now()`. [Source: Importantdoc.md#B4]
3. **`updated_at` automático** é garantido por trigger `touch_updated_at` (ou equivalente) em toda tabela que tem a coluna. [Source: Importantdoc.md#B4]
4. **Nenhum nome de tabela reservado** é usado: proibidos `user, session, account, verification, organization, member, invitation`. [Source: Importantdoc.md#B4]
5. **SEM RLS, SEM `auth.uid()`, SEM `custom_access_token_hook`, SEM tabela `profiles`** — a autorização é 100% no gateway. [Source: Importantdoc.md#B4]
6. A migration roda **depois** que o gateway cria as tabelas do Better-Auth (dependência de ordem documentada). [Source: Importantdoc.md#B4]
7. Toda referência de dono é **`owner_id text not null references "user"(id) on delete cascade`** — **TEXT**, `"user"` **entre aspas** (nunca `uuid`, nunca `references auth.users`). [Source: Importantdoc.md#B4]

## Tasks / Subtasks

- [x] Task 1: Escrever o cabeçalho de convenções da migration (AC: #1, #2, #5, #6)
- [x] Task 2: Definir o trigger `touch_updated_at` reutilizável (AC: #3)
- [x] Task 3: Checklist de nomes reservados vs. entidades do Knowledge Vault (AC: #4)
  - [x] Subtask 3.1: Confirmar que `documents`, `folders`, `shared_documents`, `document_references`, `shared_document_references`, `favorites` não colidem com reservados ✓
- [x] Task 4: Padrão canônico de `owner_id` (AC: #7)

## Dev Notes

- Exemplo canônico da fundação (copiar o padrão):
```sql
create table if not exists tarefas (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null references "user"(id) on delete cascade,  -- TEXT, "user" com aspas
  titulo      text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_tarefas_owner on tarefas(owner_id);
```
[Source: Importantdoc.md#B4]
- **Erros comuns a evitar:** `owner_id uuid`, `references auth.users`, RLS, `auth.uid()`, tabela `profiles`. [Source: Importantdoc.md#Erros comuns]
- O brief já especifica os campos em `snake_case` "porque é assim que o backend real vai devolver os dados". [Source: LOVEABLE-BRIEF.md#3]

### Project Structure Notes

- Arquivo: `supabase/migrations/0001_business_schema.sql` (protegido no manifest). As tabelas concretas vêm nas Stories 2.2–2.4.

### References

- [Source: Importantdoc.md#B4] — Regras de SCHEMA
- [Source: Importantdoc.md#Erros comuns] — não faça (owner_id uuid, RLS, etc.)
- [Source: LOVEABLE-BRIEF.md#3] — Modelo de dados (snake_case)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- Criado `knowledge/supabase/migrations/0001_business_schema.sql`, **idempotente** (`create table/index if not exists`, `create or replace function`, `drop trigger if exists` + `create trigger`) — seguro rodar mais de uma vez (re-provisionamento local via Docker, Epic 7). Não foi executado contra nenhum banco nesta sessão; fica pronto pra rodar quando o Erik subir o Postgres local.
- **Correção de nomenclatura em relação ao rascunho da story:** a story sugeria nomes de tabela no singular (`document`, `folder`...). Mantido o **plural** (`documents`, `folders`, ...) por já ser o padrão em `doc/architecture/01-stack-e-modelagem.md §3` (Aprovado) e nos repos/tipos entregues no Épico 1 — trocar agora quebraria a costura já feita. Nenhum nome (singular ou plural) colide com os reservados do Better-Auth.
- `touch_updated_at()` — 1 função reutilizada por `folders`, `documents`, `shared_documents` (únicas 3 tabelas com `updated_at`).
- `owner_id text not null references "user"(id) on delete cascade` aplicado em toda tabela escrita pelo rep (`folders`, `documents`, `document_references`, `favorites`); `shared_documents`/`shared_document_references` deliberadamente sem `owner_id` (Story 2.4).
- Migration comentada explicitando que roda **depois** das tabelas do Better-Auth — dependência de ordem documentada no cabeçalho do arquivo.
- Zero RLS, zero `auth.uid()`, zero `profiles`.

### File List

- `knowledge/supabase/migrations/0001_business_schema.sql` (novo)
