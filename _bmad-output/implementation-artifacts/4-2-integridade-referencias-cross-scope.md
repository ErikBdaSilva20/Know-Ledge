---
baseline_commit: accddbf
---

# Story 4.2: Integridade de referências cross-scope (regras de link)

Status: done

## Story

As a **responsável pela consistência do grafo de conhecimento**,
I want **as regras de integridade das referências validadas no servidor**,
so that **não existam links inválidos que quebrem o grafo ou vazem docs pessoais de outro dono**.

## Acceptance Criteria

1. Está documentada a regra: `document_reference` com `target_scope='personal'` só pode apontar para um `document` **do mesmo `owner_id`** (não linkar doc pessoal de outro dono — quebraria o link para quem não é dono). [Source: LOVEABLE-BRIEF.md#3]
2. `document_reference` com `target_scope='shared'` aponta para um `shared_document` existente (visível a todos). [Source: LOVEABLE-BRIEF.md#3]
3. `shared_document_reference` só liga `shared_document` → `shared_document` (nunca para doc pessoal) — garantido pelas FKs (Story 2.4) e reforçado na validação. [Source: LOVEABLE-BRIEF.md#3]
4. Ao criar referência, o alvo (`target_document_id`) é **validado como existente e visível** ao autor no servidor; alvo inexistente → erro (400/404). [Source: mentalidadeauditoria.md#5.5]
5. **Referência pendente (dangling):** se o alvo for excluído depois, ao navegar o link o front mostra toast "documento não encontrado" e não navega (comportamento de produto); o servidor não garante FK para o campo polimórfico. [Source: LOVEABLE-BRIEF.md#6]
6. Está documentado se a validação cross-scope precisa de **extensão do gateway** (porque envolve checar visibilidade/scope) ou se o CHECK+FK do schema já basta — recomendação registrada.

## Tasks / Subtasks

- [x] Task 1: Redigir a matriz de regras de link (personal/shared, mesmo-dono, existência) (AC: #1, #2, #3)
- [x] Task 2: Definir a validação de existência/visibilidade do alvo (AC: #4) — linkar Story 6.6
- [x] Task 3: Definir o tratamento de referência pendente (dangling) no front e no servidor (AC: #5) — linkar Story 5.4
- [x] Task 4: Recomendar schema-only vs extensão do gateway para a validação cross-scope (AC: #6)

## Dev Notes

- Como `target_document_id` é polimórfico (Story 2.3), não há FK única. A regra "personal → mesmo dono" e "não linkar pessoal de outro" **não é expressável por FK** — precisa de validação no gateway (extensão) ou é aceita como best-effort no front com o toast de fallback. Recomendo validar no servidor ao criar a referência (garantia real) e manter o toast de fallback para exclusões posteriores. [Source: LOVEABLE-BRIEF.md#3][Source: LOVEABLE-BRIEF.md#6]
- Grafo e backlinks derivam dessas tabelas no front; links inválidos poluem o grafo. Por isso a integridade importa. [Source: LOVEABLE-BRIEF.md#3][Source: LOVEABLE-BRIEF.md#5.7]

### Project Structure Notes

- Se optar por extensão, vive no `tenant-gateway`. Se schema-only, os CHECKs de enum (Story 2.3) + FKs de shared (Story 2.4) cobrem parte; a parte cross-owner fica no gateway.

### References

- [Source: LOVEABLE-BRIEF.md#3] — Regras de referência (shared→shared; não linkar pessoal de outro)
- [Source: LOVEABLE-BRIEF.md#6] — Link para destino inexistente → toast
- [Source: mentalidadeauditoria.md#5.5] — Validação no boundary

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- **Recomendação (AC#6) e implementação no mock:** validação cross-scope no `POST /data/document_references`, não só no schema — `validateReferenceTarget()` em `knowledge/dev/mock-gateway/src/routes/data.ts`: `target_scope='personal'` exige que `target_document_id` exista em `documents` **com o mesmo `owner_id` do autor** (AC#1); `target_scope='shared'` exige que exista em `shared_documents` (AC#2, visível a todos por ser lookup). Alvo inexistente/de outro dono → 404, sem CHECK/FK conseguir expressar isso sozinho (polimórfico, Story 2.3).
- `shared_document_references` já é garantida só por FK real (shared→shared, Story 2.4) — não precisou de validação adicional (AC#3).
- Dangling reference (AC#5, front): tratamento no front é responsabilidade da Story 5.4 (integridade referencial / cascade), fora do escopo desta story; aqui só documentamos que o servidor não garante FK pro campo polimórfico, então o front precisa checar existência ao navegar um link.
- **Alcance real:** isto vive no `dev/mock-gateway/` (test double local). A validação equivalente na fundação real precisa ser confirmada/replicada pelo dono do `tenant-gateway` — mesma ressalva da Story 4.1.

### File List

- `knowledge/dev/mock-gateway/src/routes/data.ts` (`validateReferenceTarget`)
