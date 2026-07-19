# Story 6.10: [VALIDAÇÃO] Formato de ids (UUID) e campos server-generated

Status: ready-for-dev

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

- [ ] Task 1: Definir a validação de UUID para rotas e corpo (AC: #1)
- [ ] Task 2: Garantir que id/created_at/updated_at são server-only (AC: #2, #3, #4) — linkar Stories 6.2/6.3
- [ ] Task 3: Casos de teste de id malformado e campos server injetados (AC: #5)
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

### Debug Log References

### Completion Notes List

### File List
