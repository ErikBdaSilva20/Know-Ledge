---
baseline_commit: 6cba9cb
---

# Story 6.4: [VALIDAÇÃO] Enums — `target_scope` e `document_scope`

Status: review

## Story

As a **responsável pela integridade dos dados**,
I want **os campos de enum validados contra seus valores permitidos no servidor e no banco**,
so that **nunca exista um scope inválido que corrompa referências, favoritos, grafo ou backlinks**.

## Acceptance Criteria

1. `document_reference.target_scope` só aceita `'personal' | 'shared'`; qualquer outro valor → **400/422** (Story 5.2). [Source: LOVEABLE-BRIEF.md#3]
2. `favorite.document_scope` só aceita `'personal' | 'shared'`; idem. [Source: LOVEABLE-BRIEF.md#3]
3. A validação é **dupla (defesa em profundidade)**: schema no gateway (Story 6.1) **e** `CHECK` no banco (Story 2.3). [Source: mentalidadeauditoria.md#5.4][Source: mentalidadeauditoria.md#5.5]
4. Os tipos TS refletem a união literal (Story 2.5), não `string`. [Source: mentalidadeauditoria.md#6.2]
5. Está documentado o efeito de um scope inválido caso escapasse: `target_document_id` apontaria para a tabela errada, quebrando grafo/backlinks — por isso a validação é crítica.
6. Um caso de teste confirma: `create document_reference { target_scope: 'group' }` → rejeitado.

## Tasks / Subtasks

- [x] Task 1: Definir os enums e seus domínios (AC: #1, #2)
- [x] Task 2: Garantir dupla validação (schema + CHECK) (AC: #3) — linkar Stories 6.1/2.3
- [x] Task 3: Alinhar os tipos TS (união literal) (AC: #4) — linkar Story 2.5
- [x] Task 4: Caso de teste de enum inválido (AC: #6)

## Dev Notes

- Connascence of Meaning: valores mágicos como scope precisam de acordo estrito entre módulos; enum validado remove ambiguidade. [Source: mentalidadeauditoria.md#3]
- O scope decide **qual tabela** o `target_document_id`/`document_id` referencia (polimórfico, Story 2.3) — um enum errado é um bug silencioso de integridade. [Source: LOVEABLE-BRIEF.md#3]

### Project Structure Notes

- CHECK no schema (2.3) + schema parser no gateway (6.1) + tipo TS (2.5). Três camadas, mesma regra.

### References

- [Source: LOVEABLE-BRIEF.md#3] — target_scope / document_scope
- [Source: mentalidadeauditoria.md#5.4] — CHECK no banco
- [Source: mentalidadeauditoria.md#3] — Connascence of Meaning

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Não executado contra Postgres real. Status `review`.

### Completion Notes List

- `target_scope`/`document_scope` são `z.enum(["personal","shared"])` em `schemas.ts` — não `z.string()` (AC#1, #2, #4).
- Dupla validação (AC#3): schema no gateway (esta story) + `CHECK` no banco (já existia desde a Story 2.3) — nenhuma mudança de schema necessária.
- Caso de teste (AC#6) novo em `dev/e2e/roteiro.sh`: `target_scope: "group"` → 400.
- AC#5 (efeito de um scope inválido escapar) já documentado em `doc/architecture/05-validacao.md §2` e no schema original (Story 2.3).

### File List

- `knowledge/dev/mock-gateway/src/schemas.ts`
- `knowledge/dev/e2e/roteiro.sh` (caso novo)
