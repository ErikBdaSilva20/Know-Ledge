# Story 2.2: Tabelas do vault pessoal — `folder` e `document`

Status: ready-for-dev

## Story

As a **engenheiro escrevendo a migration**,
I want **as tabelas `folder` e `document` modeladas com `owner_id` e integridade correta**,
so that **cada rep escreva e veja só o próprio vault, com árvore de pastas e Markdown consistentes**.

## Acceptance Criteria

1. `folder` é criada com: `id uuid pk`, `owner_id text not null references "user"(id) on delete cascade`, `parent_id uuid null references folder(id) on delete cascade`, `name text not null`, `created_at`, `updated_at`. [Source: LOVEABLE-BRIEF.md#3][Source: Importantdoc.md#B4]
2. `document` é criada com: `id uuid pk`, `owner_id text not null references "user"(id) on delete cascade`, `folder_id uuid null references folder(id) on delete set null`, `title text not null`, `content text not null default ''` (Markdown puro), `created_at`, `updated_at`. [Source: LOVEABLE-BRIEF.md#3]
3. Há índices em `owner_id` (ambas), `parent_id` (folder) e `folder_id` (document) para o list-then-filter no front. [Source: mentalidadeauditoria.md#5.4]
4. A decisão de cascade está justificada: excluir pasta com conteúdo remove filhos (o brief avisa o usuário); a relação `parent_id` auto-referente permite subpastas. [Source: LOVEABLE-BRIEF.md#6]
5. `content` é sempre Markdown (nunca binário/upload) — decisão explícita de escopo. [Source: LOVEABLE-BRIEF.md#1][Source: LOVEABLE-BRIEF.md#2.3]
6. Ambas as tabelas têm o trigger `touch_updated_at` (Story 2.1), pois há salvamento automático de documentos. [Source: LOVEABLE-BRIEF.md#5.4]

## Tasks / Subtasks

- [ ] Task 1: DDL de `folder` (AC: #1, #3, #6)
- [ ] Task 2: DDL de `document` (AC: #2, #3, #5, #6)
- [ ] Task 3: Definir a política de cascade de exclusão e documentar o efeito na UI (AC: #4) — linkar Story 5.4
- [ ] Task 4: Índices `idx_folder_owner`, `idx_folder_parent`, `idx_document_owner`, `idx_document_folder`

## Dev Notes

- **Decisão de cascade de `folder_id` em `document`:** o brief diz que excluir pasta apaga o conteúdo dentro (aviso ao usuário). Duas opções: (a) `on delete cascade` no `folder_id` do document → apagar pasta apaga documentos; (b) `on delete set null` + limpeza explícita. Recomendo **cascade** para casar com o comportamento "tudo dentro também será excluído". Ajustar AC#2 se optar por cascade. [Source: LOVEABLE-BRIEF.md#6]
- `parent_id`/`folder_id` são **null** para raiz — modelar nullable. [Source: LOVEABLE-BRIEF.md#3]
- **Não** existe get-by-id: abrir um documento é list + find no front (Story 1.2). Os índices servem ao gateway/consultas de lista, não a filtros server-side. [Source: Importantdoc.md#B5]

### Project Structure Notes

- Estas são tabelas **escritas pelo rep** → `owner_id` obrigatório (§B4.1). Ver Story 3.1 (owner_id da sessão) e 3.3 (visibilidade).

### References

- [Source: LOVEABLE-BRIEF.md#3] — folder, document
- [Source: LOVEABLE-BRIEF.md#6] — Excluir pasta com conteúdo
- [Source: Importantdoc.md#B4] — Regras de schema

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
