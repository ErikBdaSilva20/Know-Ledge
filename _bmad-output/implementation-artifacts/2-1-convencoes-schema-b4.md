# Story 2.1: Convenções de schema §B4 (a parte mais importante — seguir à risca)

Status: ready-for-dev

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

- [ ] Task 1: Escrever o cabeçalho de convenções da migration (AC: #1, #2, #5, #6)
- [ ] Task 2: Definir o trigger `touch_updated_at` reutilizável (AC: #3)
- [ ] Task 3: Checklist de nomes reservados vs. entidades do Knowledge Vault (AC: #4)
  - [ ] Subtask 3.1: Confirmar que `document`, `folder`, `shared_document`, `document_reference`, `shared_document_reference`, `favorite` não colidem com reservados ✓
- [ ] Task 4: Padrão canônico de `owner_id` (AC: #7)

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

### Debug Log References

### Completion Notes List

### File List
