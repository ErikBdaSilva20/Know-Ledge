# Story 6.3: [VALIDAÇÃO] Whitelist de campos — proteção contra mass-assignment

Status: ready-for-dev

## Story

As a **responsável pela segurança**,
I want **que só campos explicitamente permitidos por entidade sejam aceitos em `create`/`update`**,
so that **campos desconhecidos ou server-only não sejam gravados via mass-assignment**.

## Acceptance Criteria

1. Cada schema de entidade define uma **whitelist estrita** de campos aceitos; campos fora dela são **rejeitados** (ou removidos) — nunca gravados. [Source: mentalidadeauditoria.md#5.5][Source: mentalidadeauditoria.md#5.6]
2. Campos server-only (`id`, `owner_id`, `published_by`, `created_at`, `updated_at`) **nunca** estão na whitelist de entrada. [Source: Importantdoc.md#B5]
3. Whitelists por entidade:
   - `folder`: `parent_id`, `name`
   - `document`: `folder_id`, `title`, `content`
   - `document_reference`: `source_document_id`, `target_scope`, `target_document_id`
   - `favorite`: `document_scope`, `document_id`
   - `shared_document` (manager/admin): `title`, `content`, `source_document_id`
   - `shared_document_reference` (manager/admin): `source_shared_document_id`, `target_shared_document_id`
   [Source: LOVEABLE-BRIEF.md#3]
4. Em `update`, só um subconjunto mutável é aceito (ex.: `document` update aceita `title`, `content`, `folder_id`; nunca `owner_id`). [Source: mentalidadeauditoria.md#6.2]
5. Payload com campo desconhecido → **400** (Story 5.2), sem persistir.
6. A whitelist é a mesma fonte usada pelos schemas da Story 6.1.

## Tasks / Subtasks

- [ ] Task 1: Definir a whitelist de create por entidade (AC: #1, #2, #3)
- [ ] Task 2: Definir a whitelist de update (subconjunto mutável) por entidade (AC: #4)
- [ ] Task 3: Definir comportamento para campo desconhecido (reject/strip) (AC: #5)

## Dev Notes

- Mass-assignment: aceitar campos arbitrários do cliente permite escalonar (setar owner_id, flags internas). A whitelist é a defesa. [Source: mentalidadeauditoria.md#5.6]
- No Knowledge Vault os campos mutáveis são poucos e bem definidos (Markdown + organização) — a whitelist é curta e fácil de manter. [Source: LOVEABLE-BRIEF.md#3]
- `content` é sempre Markdown (string) — sem upload/binário (Story 6.7). [Source: LOVEABLE-BRIEF.md#2.3]

### Project Structure Notes

- Server-side. Complementa 6.2 (owner_id/published_by) como caso específico crítico.

### References

- [Source: mentalidadeauditoria.md#5.5] — Validação estruturada no boundary
- [Source: mentalidadeauditoria.md#5.6] — Mass-assignment / escalonamento
- [Source: LOVEABLE-BRIEF.md#3] — Campos por entidade

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
