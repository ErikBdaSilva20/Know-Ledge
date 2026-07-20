---
baseline_commit: 6cba9cb
---

# Story 6.10: [VALIDAÇÃO] Formato de ids (UUID) e campos server-generated

Status: review

## Story

As a **responsável pela integridade dos dados**,
I want **ids validados como UUID e timestamps/ids sempre gerados pelo servidor**,
so that **não entrem ids malformados nem o cliente controle campos que devem ser do servidor**.

## Acceptance Criteria

1. Todo `:id` de rota e todo id em corpo (`source_document_id`, `target_document_id`, `folder_id`, `parent_id`, `document_id`) é validado como **UUID** no boundary; formato inválido → **400**. [Source: mentalidadeauditoria.md#5.5][Source: Importantdoc.md#B4]
2. `id`, `created_at`, `updated_at` são **sempre server-generated** (`gen_random_uuid()`, `now()`, trigger) — o cliente nunca os envia (Story 6.2/6.3). [Source: Importantdoc.md#B4]
3. `updated_at` é atualizado por **trigger** no servidor, não pelo cliente (Story 2.1). [Source: Importantdoc.md#B4]
4. Campos de data recebidos do cliente (se algum) são rejeitados — datas são do servidor. [Source: mentalidadeauditoria.md#5.6]
5. Um caso de teste confirma: `PATCH document/not-a-uuid` → 400; `create document { id: "x", created_at: "..." }` → campos ignorados/rejeitados. [Source: mentalidadeauditoria.md#5.6]
6. Considerar **branded types** (`DocumentId`, `FolderId`, `UserId`) para evitar troca de id entre parâmetros (nice-to-have, Story 2.5). [Source: mentalidadeauditoria.md#6.2]

## Tasks / Subtasks

- [x] Task 1: Definir a validação de UUID para rotas e corpo (AC: #1)
- [x] Task 2: Garantir que id/created_at/updated_at são server-only (AC: #2, #3, #4) — linkar Stories 6.2/6.3
- [x] Task 3: Casos de teste de id malformado e campos server injetados (AC: #5)
- [ ] Task 4: Avaliar branded types (AC: #6) — linkar Story 2.5

## Dev Notes

- `id uuid default gen_random_uuid()` e timestamps `default now()` são do §B4 — o cliente não os fornece. [Source: Importantdoc.md#B4]
- Validar UUID cedo evita erro obscuro no banco e ataques de injeção via id malformado. [Source: mentalidadeauditoria.md#5.5][Source: mentalidadeauditoria.md#5.6]
- Branded types deixam impossível passar um `UserId` onde se espera `DocumentId`. [Source: mentalidadeauditoria.md#6.2]

### Project Structure Notes

- Validação de UUID no schema parser do gateway (Story 6.1). Tipos em `types.gen.ts` (Story 2.5).

### References

- [Source: Importantdoc.md#B4] — id uuid, timestamps default, trigger
- [Source: mentalidadeauditoria.md#5.5] — validação de formato no boundary
- [Source: mentalidadeauditoria.md#6.2] — branded types

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Não executado contra Postgres real. Status `review`.

### Completion Notes List

- `:id` de rota (`PATCH`/`DELETE /data/:table/:id`) validado como UUID **antes** de qualquer query, via `isUuid()` (`schemas.ts`) — formato inválido → 400, sem nunca chegar no banco (AC#1).
- Todo id em corpo (`parent_id`, `folder_id`, `source_document_id`, `target_document_id`, `document_id`, `source_shared_document_id`, `target_shared_document_id`) já é `z.string().uuid()` nos schemas Zod (Story 6.1) — coberto de graça, não duplicado aqui.
- `id`/`created_at`/`updated_at` nunca aceitos em nenhum schema (Story 6.2/6.3) — sempre `gen_random_uuid()`/`now()`/trigger (AC#2, #3, #4).
- Casos de teste novos (AC#5): `PATCH documents/not-a-uuid` → 400. O caso "campos server injetados" já existia (owner_id, Story 6.2).
- **AC#6 (branded types) não implementado** — fica registrado como nice-to-have, mesma decisão da Story 2.5 original: não crítico o suficiente pro esforço agora.

### File List

- `knowledge/dev/mock-gateway/src/schemas.ts` (`isUuid`)
- `knowledge/dev/mock-gateway/src/routes/data.ts` (checagem no `PATCH`/`DELETE`)
- `knowledge/dev/e2e/roteiro.sh` (caso novo)
