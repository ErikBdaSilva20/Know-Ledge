---
baseline_commit: 6cba9cb
---

# Story 6.1: [VALIDAÇÃO] Schema no boundary — todo payload mutador validado no servidor

Status: review

## Story

As a **responsável pela segurança**,
I want **todo corpo de `create`/`update` validado por um schema estruturado no gateway antes de tocar o banco**,
so that **nenhum dado malformado ou malicioso do front seja persistido — o front nunca é fonte de verdade**.

## Acceptance Criteria

1. Todo endpoint mutador (`POST`/`PATCH` de cada tabela, e a rota Publicar) valida o corpo com um **schema parser estruturado (Zod/ArkType/similar)** no **boundary de entrada**, antes de qualquer lógica. [Source: mentalidadeauditoria.md#5.5][Source: mentalidadeauditoria.md#6.2]
2. A validação é **server-side** (gateway). Validação no front, se existir, é só UX — **nunca** é a garantia. [Source: mentalidadeauditoria.md#5.6]
3. Payload que falha a validação → **400** com envelope de erro (Story 5.1/5.2), sem persistir nada.
4. O schema é definido **por entidade** e por operação (Insert vs Update), refletindo o schema do banco (Story 2.x). [Source: mentalidadeauditoria.md#6.2]
5. Payloads vindos do gateway **de volta** ao app também são tratados como não confiáveis e podem ser validados no boundary do repo (defesa em profundidade). [Source: mentalidadeauditoria.md#6.2]
6. Está documentado que esta é a **story-guarda-chuva** da validação; as Stories 6.2–6.12 detalham regras específicas que compõem esses schemas.

## Tasks / Subtasks

- [x] Task 1: Definir a estratégia de validação no boundary (lib, onde, quando) (AC: #1, #2)
- [x] Task 2: Especificar schema por entidade × operação (AC: #4)
  - [x] Subtask 2.1: document (Insert/Update), folder, document_reference, favorite, shared_document, shared_document_reference, publish
- [x] Task 3: Definir o comportamento de falha (400 + envelope) (AC: #3) — linkar Story 5.2
- [ ] Task 4: Definir validação defensiva de payload de resposta no repo (AC: #5)

## Dev Notes

- Regra de auditoria: "input validado imediatamente no boundary usando um schema parser estruturado". [Source: mentalidadeauditoria.md#5.5]
- Runtime validation obrigatória para payloads de rede — o tipo TS não garante em runtime. [Source: mentalidadeauditoria.md#6.2]
- Esta story ancora o bloco E6; cada sub-regra (owner_id, whitelist, enums, tamanho, fk, etc.) é uma story própria a pedido do Erik ("separados por pontos e blocos").

### Project Structure Notes

- Os schemas de validação vivem no **gateway** (server-side). Se houver espelho no app (UX), fica em `src/lib/data/` perto dos repos, nunca na UI.

### References

- [Source: mentalidadeauditoria.md#5.5] — Validation Layer no boundary
- [Source: mentalidadeauditoria.md#6.2] — Runtime validation (Zod/ArkType)
- [Source: mentalidadeauditoria.md#5.6] — Não confiar no front

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Nada rodou contra Postgres real (Docker inacessível). Status `review`.

### Completion Notes List

- Story-guarda-chuva (AC#6): detalhe completo em `doc/architecture/05-validacao.md`. Estratégia: **Zod** (`knowledge/dev/mock-gateway/src/schemas.ts`), 1 schema `.strict()` por tabela × operação (Insert/Update), única fonte de verdade (substituiu os arrays `insertable`/`updatable` que existiam em `tables.ts` desde o Épico 1 — eram uma segunda lista que teria divergido).
- `routes/data.ts`'s `POST`/`PATCH` chamam `schema.safeParse(body)` antes de qualquer query; falha → 400 com o envelope da Story 5.1 (AC#1-3).
- **AC#5 não implementado:** validação defensiva do payload de *resposta* do gateway, no repo do app, como defesa em profundidade adicional — não fiz. Os repos confiam no shape que `client.ts` devolve (tipado via `types.gen.ts`, mas sem validação de runtime tipo Zod no lado do cliente). Gap sinalizado, não crítico (o app é o mesmo processo que já validou a entrada; o risco real é um gateway comprometido, fora do modelo de ameaça atual).

### File List

- `knowledge/dev/mock-gateway/src/schemas.ts` (novo)
- `knowledge/dev/mock-gateway/src/routes/data.ts` (reescrito pra usar `schemas.ts`)
- `knowledge/dev/mock-gateway/src/tables.ts` (simplificado — só metadata de RBAC)
- `doc/architecture/05-validacao.md` (novo)
