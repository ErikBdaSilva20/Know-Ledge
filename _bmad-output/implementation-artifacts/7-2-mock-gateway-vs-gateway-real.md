---
baseline_commit: accddbf
---

# Story 7-2: Escolha do gateway local — real (alta fidelidade) vs mock (contrato mínimo)

Status: done

## Story

As a **Erik montando o tenant-local**,
I want **decidir entre rodar o gateway real em Docker ou um mock-gateway que replica o contrato**,
so that **eu tenha o melhor equilíbrio entre fidelidade e independência do repo privado do gateway**.

## Acceptance Criteria

1. Estão documentadas as **duas opções** com trade-offs:
   - **A) Gateway real em Docker** (se o repo `Cerebra-AI/tenant-gateway` estiver acessível): fidelidade máxima — testa o RBAC/owner_id/validação reais. Recomendado quando o repo está disponível. [Source: Importantdoc.md#B2]
   - **B) Mock-gateway** (Hono/Express mínimo): reproduz o **contrato** (`/data/:table` + `credentials`/`X-Tenant-Id` + owner_id-da-sessão + RBAC de tabela ownerless + status de erro). Independente do repo privado, menor fidelidade. [Source: Importantdoc.md#B5]
2. Se **B**, o mock **precisa** replicar fielmente os invariantes de segurança testáveis: owner_id da sessão (3.1/6.2), papel server-side (3.2), visibilidade por papel (3.3), IDOR (3.4), gate ownerless (3.5), status de erro (5.2), validação de schema (6.1). [Source: mentalidadeauditoria.md#5.6]
3. O mock é **explicitamente rotulado como test double** — não é o backend de produção e não deve divergir do contrato do gateway real. [Source: Importantdoc.md#B3]
4. A escolha não afeta o app: a flag `VITE_DATA_SOURCE=gateway` + `VITE_GATEWAY_URL=localhost` funciona igual para A ou B (Story 7.4). [Source: Importantdoc.md#B5]
5. Está registrado o risco de **drift**: um mock que diverge do gateway real dá falsa confiança. Mitigação: lista de invariantes que o mock DEVE honrar (AC#2) e um aviso para revalidar contra o gateway real antes de produção.
6. Recomendação final registrada (A se o repo estiver acessível; senão B com a checklist de fidelidade).

## Tasks / Subtasks

- [x] Task 1: Documentar as opções A e B com trade-offs (AC: #1)
- [x] Task 2: Definir a lista de invariantes que o mock deve honrar (AC: #2, #5)
- [x] Task 3: Confirmar a neutralidade da escolha para o app (AC: #4) — linkar Story 7.4
- [x] Task 4: Registrar a recomendação (AC: #6)

## Dev Notes

- **Alta fidelidade importa aqui** porque o objetivo do Erik é testar se os fluxos de segurança (zero-trust) realmente funcionam — um mock frouxo esconde exatamente os bugs que queremos pegar. Por isso o mock, se usado, tem uma checklist dura de invariantes. [Source: mentalidadeauditoria.md#5.6]
- O contrato do `db.table` é simples (list/create/update/remove) — um mock-gateway é viável, mas o RBAC de tabela ownerless (o achado do épico) precisa ser reproduzido fielmente. [Source: Importantdoc.md#B4.1][Source: Importantdoc.md#B5]

### Project Structure Notes

- Se A: submódulo/imagem do gateway em `dev/`. Se B: `dev/mock-gateway/` (test double, dev-only).

### References

- [Source: Importantdoc.md#B2] — repo do gateway
- [Source: Importantdoc.md#B4.1] — RBAC ownerless (o mock precisa reproduzir)
- [Source: Importantdoc.md#B5] — contrato db.table
- [Source: mentalidadeauditoria.md#5.6] — invariantes de segurança a testar

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- **Decisão: Opção B (mock-gateway)** — `Cerebra-AI/tenant-gateway` é privado e não está acessível neste ambiente (AC#1, #6).
- Todos os invariantes da checklist (AC#2) foram **implementados**, não só listados, em `knowledge/dev/mock-gateway/`: owner_id/published_by da sessão (`routes/data.ts`, `routes/publish.ts`), papel server-side (`middleware.ts` + `tables.ts`), visibilidade por papel (`GET` filtra por `owner_id` quando `role==='rep'`), IDOR (WHERE atômico no `PATCH`/`DELETE`, 404 uniforme), gate ownerless (`POST` recusa `rep`), validação de tenant (`requireTenant`, Story 6.9), status de erro básico (`errors.ts`).
- Rotulado explicitamente como test double em `dev/README.md`, com o aviso de drift (AC#3, #5): "antes de confiar em produção, revalide contra o gateway real".
- Neutralidade pro app (AC#4): confirmada por construção — o app só enxerga `VITE_GATEWAY_URL`/`VITE_DATA_SOURCE` (Story 1.3/1.6); não sabe nem precisa saber se o outro lado é o mock ou o gateway real.

### File List

- `knowledge/dev/mock-gateway/` (implementação completa do test double)
- `knowledge/dev/README.md` (decisão e trade-offs documentados)
