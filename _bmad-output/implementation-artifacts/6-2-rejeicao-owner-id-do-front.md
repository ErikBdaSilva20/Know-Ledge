---
baseline_commit: 6cba9cb
---

# Story 6.2: [VALIDAÇÃO] Rejeitar/ignorar `owner_id` (e `published_by`) vindos do front

Status: review

## Story

As a **responsável pela segurança**,
I want **que campos de posse/atribuição enviados pelo front sejam ignorados ou rejeitados pelo gateway**,
so that **ninguém falsifique dono ou autor de um registro (IDOR de atribuição)**.

## Acceptance Criteria

1. Se o corpo de `create`/`update` contiver `owner_id`, o gateway **ignora** (sobrescreve com o da sessão) ou **rejeita com 400** — nunca persiste o valor do front. [Source: Importantdoc.md#B5][Source: mentalidadeauditoria.md#5.6]
2. O mesmo vale para `published_by` (`shared_document`) — sempre server-derived na rota Publicar (Story 4.1). [Source: Importantdoc.md#B5]
3. Está definida a política escolhida (**strip silencioso** vs **reject explícito**) e documentada de forma consistente para todas as entidades. Recomendação: **reject** em campos server-only para falhar alto e cedo.
4. Os repos não incluem esses campos no payload (Story 1.6/3.1); esta story garante o comportamento **mesmo que** um cliente adulterado os inclua.
5. Um caso de teste negativo confirma: `POST document { owner_id: "<outro>" }` → registro fica com o owner da sessão (ou 400), nunca com o injetado. [Source: mentalidadeauditoria.md#5.6]
6. É a materialização atômica da Story 3.1 (owner_id da sessão).

## Tasks / Subtasks

- [x] Task 1: Definir a lista de campos server-only por entidade: `owner_id`, `published_by`, `id`, `created_at`, `updated_at` (AC: #1, #2)
- [x] Task 2: Escolher e documentar política strip vs reject (AC: #3)
- [x] Task 3: Caso de teste de injeção de owner_id/published_by (AC: #5) — linkar Story 7.5

## Dev Notes

- Vetor: IDOR de atribuição — criar/alterar registro em nome de outro. É P0 de segurança. [Source: mentalidadeauditoria.md#7]
- Doc é explícito: "owner_id é setado pelo gateway — NÃO mande do front". Esta story garante o "não confie" mesmo com cliente hostil. [Source: Importantdoc.md#B5]
- Conecta com 6.3 (whitelist geral de campos) — owner_id/published_by são um caso da whitelist, mas ganham story própria por serem o núcleo do zero-trust.

### Project Structure Notes

- Server-side (gateway). Complementa 3.1 e 6.3.

### References

- [Source: Importantdoc.md#B5] — owner_id do gateway, não do front
- [Source: mentalidadeauditoria.md#5.6] — IDOR
- [Source: mentalidadeauditoria.md#7] — Prioridade P0 de segurança

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Não executado contra Postgres real. Status `review`.

### Completion Notes List

- **Política escolhida: reject (400), não strip silencioso** — AC#3 recomendava reject, implementado via `.strict()` nos schemas Zod de `schemas.ts`: `owner_id`/`published_by`/`id`/`created_at`/`updated_at` não são campos declarados em nenhum schema, então mandá-los é rejeição automática. Consistente pra todas as entidades (uma única lista, `schemas.ts`, não uma política por tabela).
- Repos do app (Story 1.6/3.1) continuam fazendo o strip antes de enviar — defesa em profundidade, não a única linha (AC#4).
- **Correção em `dev/e2e/roteiro.sh`:** o caso de teste antigo esperava `owner_id` injetado ser "ignorado, fica com o da sessão" (201). Com a política reject, agora é **400** — teste atualizado (AC#5).

### File List

- `knowledge/dev/mock-gateway/src/schemas.ts`
- `knowledge/dev/e2e/roteiro.sh` (caso corrigido)
