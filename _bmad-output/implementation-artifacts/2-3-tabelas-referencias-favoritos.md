# Story 2.3: Tabelas filhas escritas pelo rep — `document_reference` e `favorite`

Status: ready-for-dev

## Story

As a **engenheiro escrevendo a migration**,
I want **`document_reference` e `favorite` modeladas com `owner_id` (mesmo sendo "filhas")**,
so that **o rep consiga criar links e favoritos sem tomar 403 — o gotcha de RBAC nº1 do §B4.1**.

## Acceptance Criteria

1. `document_reference` é criada com: `id uuid pk`, **`owner_id text not null references "user"(id) on delete cascade`**, `source_document_id uuid not null references document(id) on delete cascade`, `target_scope text not null check (target_scope in ('personal','shared'))`, `target_document_id uuid not null`, `created_at`. [Source: LOVEABLE-BRIEF.md#3]
2. `favorite` é criada com: `id uuid pk`, **`owner_id text not null references "user"(id) on delete cascade`**, `document_scope text not null check (document_scope in ('personal','shared'))`, `document_id uuid not null`, `created_at`. [Source: LOVEABLE-BRIEF.md#3]
3. **É explicitado o gotcha §B4.1**: ambas são filhas escritas pelo rep → **precisam** de `owner_id`; sem ele o rep toma 403 ao salvar link/favorito. [Source: Importantdoc.md#B4.1]
4. `target_scope`/`document_scope` têm `CHECK` de enum no banco além da validação no gateway (defesa em profundidade; Story 6.4). [Source: mentalidadeauditoria.md#5.5]
5. `target_document_id`/`document_id` **não** têm FK direta (apontam para `document` OU `shared_document` conforme o scope) — a integridade é validada no gateway/extensão (Story 4.2), não por FK única. Isso é documentado como decisão consciente.
6. Índices em `owner_id` e `source_document_id` (references) e `owner_id` (favorite). [Source: mentalidadeauditoria.md#5.4]

## Tasks / Subtasks

- [ ] Task 1: DDL de `document_reference` com `owner_id` + CHECK de `target_scope` (AC: #1, #3, #4)
- [ ] Task 2: DDL de `favorite` com `owner_id` + CHECK de `document_scope` (AC: #2, #3, #4)
- [ ] Task 3: Documentar por que `target_document_id` é polimórfico sem FK e como a integridade é garantida (AC: #5) — linkar Story 4.2
- [ ] Task 4: Índices `idx_docref_owner`, `idx_docref_source`, `idx_favorite_owner`

## Dev Notes

- **Este é o erro que mais quebra port** (§B4.1): esquecer `owner_id` em tabela-filha. `document_reference` e `favorite` são filhas mas **escritas pelo rep** → `owner_id` obrigatório. [Source: Importantdoc.md#B4.1][Source: Importantdoc.md#Erros comuns]
- `target_scope='personal'` → `target_document_id` referencia `document`; `='shared'` → referencia `shared_document`. Por isso não há uma FK única. A regra "documento compartilhado só linka para compartilhado" e "não linkar para doc pessoal de outro dono" é validada no gateway (Story 4.2). [Source: LOVEABLE-BRIEF.md#3]
- Backlinks são derivados: para o doc X, são as referências cujo alvo é X — calculado no front (Story 1.5). [Source: LOVEABLE-BRIEF.md#3]

### Project Structure Notes

- Considerar índice único opcional em `favorite(owner_id, document_scope, document_id)` para evitar favorito duplicado (validação de unicidade; ver Story 6.6).

### References

- [Source: LOVEABLE-BRIEF.md#3] — document_reference, favorite
- [Source: Importantdoc.md#B4.1] — gotcha de RBAC (owner_id em filhas)
- [Source: Importantdoc.md#Erros comuns] — Tabela-filha sem owner_id

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
