---
baseline_commit: 6cba9cb
---

# Story 6.6: [VALIDAÇÃO] Referências e FKs — alvo existente, visível e do mesmo tenant/dono

Status: review

## Story

As a **responsável pela integridade referencial**,
I want **que `parent_id`, `folder_id` e os alvos de referência/favorito sejam validados como existentes e autorizados**,
so that **não se criem links/pastas apontando para recursos inexistentes ou de outro dono**.

## Acceptance Criteria

1. `folder.parent_id` (se não-nulo) deve existir e pertencer ao **mesmo `owner_id`** (rep não aninha em pasta de outro). Inválido → **400/404**. [Source: LOVEABLE-BRIEF.md#3][Source: mentalidadeauditoria.md#5.6]
2. `document.folder_id` (se não-nulo) deve existir e pertencer ao mesmo `owner_id`. [Source: LOVEABLE-BRIEF.md#3]
3. `document_reference`: `source_document_id` deve ser um `document` do autor; `target_document_id` deve existir e ser visível conforme `target_scope` (Story 4.2). [Source: LOVEABLE-BRIEF.md#3]
4. `favorite.document_id` deve existir no scope indicado e ser visível ao autor. [Source: LOVEABLE-BRIEF.md#3]
5. FKs reais no schema (folder→folder, document→folder, references de shared) cobrem parte; o restante (polimórfico + regra de dono) é validado **no gateway**. [Source: Importantdoc.md#B4][Source: mentalidadeauditoria.md#5.4]
6. Unicidade opcional: evitar `favorite` duplicado (mesmo owner+scope+document) — índice único + 409 (Story 6.11). [Source: mentalidadeauditoria.md#5.4]

## Tasks / Subtasks

- [x] Task 1: Validar `parent_id`/`folder_id` existência + mesmo dono (AC: #1, #2)
- [x] Task 2: Validar alvos de referência (source do autor, target existente/visível) (AC: #3) — linkar Story 4.2
- [x] Task 3: Validar alvo de favorito (AC: #4)
- [x] Task 4: Definir o que é FK-schema vs validação-gateway (AC: #5)
- [x] Task 5: Definir unicidade de favorito (AC: #6) — linkar Story 6.11

## Dev Notes

- FKs pegam existência dentro do tenant; a **regra de dono** (mesmo owner_id) para `parent_id`/`folder_id` não é FK — é validação no gateway (o front nunca decide). [Source: mentalidadeauditoria.md#5.6]
- Alvo polimórfico (`target_document_id`) não tem FK; validar existência/visibilidade no servidor ao criar a referência é a garantia real (Story 4.2). [Source: LOVEABLE-BRIEF.md#3]
- Isso previne "pasta órfã", "documento em pasta de outro" e "link para o nada" na criação (o dangling pós-exclusão é tratado na Story 5.4).

### Project Structure Notes

- Server-side. Junta o CHECK/FK do schema (E2) com a validação de negócio (gateway/extensão).

### References

- [Source: LOVEABLE-BRIEF.md#3] — relações e regras de referência
- [Source: mentalidadeauditoria.md#5.4] — FK / unique
- [Source: mentalidadeauditoria.md#5.6] — autorização por id

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Não executado contra Postgres real. Status `review`.

### Completion Notes List

- **Novo nesta story:** `assertOwnedFolder(folderId, ownerId)` em `routes/data.ts` — `folder.parent_id`/`document.folder_id`, se não-nulo, precisa existir e pertencer ao mesmo `owner_id`; senão 404. Chamado no `create` de `folders`/`documents` e no `update` de `documents` quando `folder_id` está no patch (AC#1, #2).
- `assertReferenceTarget` (AC#3) já existia desde a Story 4.2 — reaproveitada, não duplicada.
- **Novo:** `assertFavoriteTarget(scope, documentId, ownerId)` — `favorite.document_id` precisa existir e ser visível no scope indicado (AC#4).
- FK-schema vs validação-gateway (AC#5): FKs reais (`folder→folder`, `document→folder`, refs de shared) cobrem existência dentro do schema; a regra "mesmo dono" nunca é FK, é sempre gateway — documentado em `05-validacao.md §4`.
- Unicidade de favorito (AC#6): já é índice único desde a Story 2.3 (`uq_favorites_owner_doc`); `translatePgError` (Story 5.5) já traduz a violação em 409 — nada novo.
- Caso de teste novo: `folder_id` inexistente → 404.

### File List

- `knowledge/dev/mock-gateway/src/routes/data.ts` (`assertOwnedFolder`, `assertFavoriteTarget`)
- `knowledge/dev/e2e/roteiro.sh` (caso novo)
