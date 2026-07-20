---
baseline_commit: 2ef89e5
---

# Story 2.4: Tabelas da Base Compartilhada — `shared_document` e `shared_document_reference` (ownerless = lookup)

Status: done

## Story

As a **engenheiro escrevendo a migration**,
I want **as tabelas compartilhadas modeladas SEM `owner_id` (lista plana)**,
so that **o gateway as trate como lookup — leitura a todos, escrita só admin/manager — implementando a regra do produto de graça**.

## Acceptance Criteria

1. `shared_document` é criada com: `id uuid pk`, `title text not null`, `content text not null default ''`, `source_document_id uuid null`, `published_by text not null references "user"(id)`, `created_at`, `updated_at`. **Sem `owner_id`, sem `folder_id`.** [Source: LOVEABLE-BRIEF.md#3]
2. `shared_document_reference` é criada com: `id uuid pk`, `source_shared_document_id uuid not null references shared_document(id) on delete cascade`, `target_shared_document_id uuid not null references shared_document(id) on delete cascade`, `created_at`. **Sem `owner_id`.** [Source: LOVEABLE-BRIEF.md#3]
3. **É explicitado o achado crítico**: por não terem `owner_id`, o gateway trata ambas como **tabelas lookup** → leitura liberada a qualquer logado; **escrita só admin/manager**. Isso implementa "rep só lê a base compartilhada; manager/admin publicam/editam" **sem código de autorização**. [Source: Importantdoc.md#B4 (item 6)][Source: Importantdoc.md#B4.1][Source: LOVEABLE-BRIEF.md#5.5]
4. `published_by` é **setado pelo gateway a partir da sessão** na rota de Publicar (Story 4.1), nunca enviado pelo front. [Source: Importantdoc.md#B5]
5. `source_document_id` é **só rastreabilidade** ("publicado a partir de...") e é **nullable** (a cópia é independente; editar um lado não afeta o outro). [Source: LOVEABLE-BRIEF.md#3][Source: LOVEABLE-BRIEF.md#6]
6. A regra "shared só linka para shared" é garantida pelas FKs de `shared_document_reference` (ambas apontam para `shared_document`). [Source: LOVEABLE-BRIEF.md#3]

## Tasks / Subtasks

- [x] Task 1: DDL de `shared_document` (sem owner_id) (AC: #1, #4, #5)
- [x] Task 2: DDL de `shared_document_reference` (sem owner_id, FKs shared→shared) (AC: #2, #6)
- [x] Task 3: Documentar o comportamento lookup do gateway e o mapeamento para a regra de produto (AC: #3)
- [x] Task 4: Nota: `published_by` server-derived (linkar Story 4.1) e `source_document_id` como rastreabilidade nullable (AC: #4, #5)

## Dev Notes

- **Esta é a joia arquitetural** do Knowledge Vault: a ausência de `owner_id` não é descuido — é o que faz o gateway aplicar o RBAC certo automaticamente. Um rep tentando `POST/PATCH/DELETE` em `shared_document` recebe 403 do gateway porque não é admin/manager e a tabela não tem `owner_id`. [Source: Importantdoc.md#B4.1]
- **Cuidado:** como `published_by` referencia `"user"(id)`, se um usuário for removido, decidir política (`on delete set null` vs. manter). O brief não exige cascade aqui; recomendo `on delete set null` para preservar o documento publicado. Documentar a decisão.
- A cópia é **independente**: publicar cria um `shared_document` novo; editar depois um lado não afeta o outro (o produto deixa isso implícito ao usuário). [Source: LOVEABLE-BRIEF.md#6]
- `shared_document` é visível a todos: no grafo e na busca, aparece junto dos pessoais (diferenciável por cor). [Source: LOVEABLE-BRIEF.md#5.7]

### Project Structure Notes

- Escrita nestas tabelas só ocorre via manager/admin (edição direta) ou via rota Publicar (Story 4.1). Ver Story 3.5 (gate de escrita) e 4.2 (integridade de referências).

### References

- [Source: LOVEABLE-BRIEF.md#3] — shared_document, shared_document_reference
- [Source: LOVEABLE-BRIEF.md#5.5] — Base compartilhada (rep lê, manager/admin editam)
- [Source: Importantdoc.md#B4] — item 6 (tabelas lookup)
- [Source: Importantdoc.md#B4.1] — gateway recusa escrita sem owner_id de não-admin/manager

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- `shared_documents`/`shared_document_references` criadas **sem `owner_id`** — tabela lookup: leitura liberada a qualquer logado, escrita só admin/manager, de graça, sem código de autorização (AC#3, a "joia arquitetural" citada nos Dev Notes).
- `shared_document_reference` com ambas FKs (`source_shared_document_id`, `target_shared_document_id`) apontando pra `shared_documents(id) on delete cascade` — garante estruturalmente que shared só linka pra shared (AC#6).
- **Conflito resolvido entre AC#1 (`published_by ... not null`) e o Dev Note ("recomendo `on delete set null`"):** uma coluna `NOT NULL` não pode ser nulada por uma FK action — são mutuamente exclusivos. Segui o AC (contrato formal) e deixei o FK sem cascade/set null (`NO ACTION` padrão do Postgres): apagar um usuário que publicou algo exige reatribuir `published_by` primeiro, o que protege a base compartilhada de perder autoria silenciosamente. Documentado inline na migration.
- `source_document_id` nullable, sem FK — só rastreabilidade; editar um lado não afeta o outro (cópia independente, AC#5).

### File List

- `knowledge/supabase/migrations/0001_business_schema.sql` (tabelas `shared_documents`/`shared_document_references`, entregue na Story 2.1)
