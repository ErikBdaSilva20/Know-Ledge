---
baseline_commit: 2029dfc
---

# Story 5.1: Envelope de erro padrão e tradução na camada de dados

Status: review

## Story

As a **engenheiro que consome o gateway**,
I want **um formato de erro consistente e uma camada `errors.ts` que traduz erro do gateway → erro de domínio**,
so that **a UI trate falhas de forma previsível, sem vazar internals nem depender do corpo de erro para segurança**.

## Acceptance Criteria

1. É definido um **envelope de erro canônico** retornado pelo gateway, ex.: `{ error: { code: string, message: string, details?: unknown, request_id: string } }` — estável e versionável. [Source: mentalidadeauditoria.md#5.3][Source: mentalidadeauditoria.md#5.5]
2. **Nenhum stack trace, SQL cru, nome de tabela/coluna interna ou segredo** aparece no corpo enviado ao cliente. Mensagens ao usuário são amigáveis; detalhes técnicos vão só para o log. [Source: mentalidadeauditoria.md#5.3][Source: mentalidadeauditoria.md#5.6]
3. `src/lib/data/errors.ts` traduz o envelope em **tipos de erro de domínio** discrimináveis (ex.: `ValidationError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `UnexpectedError`) — a UI decide toast/redirect a partir do tipo, nunca fazendo parse de string. [Source: mentalidadeauditoria.md#6.2]
4. Os repos **nunca** vazam `Response`/`fetch`/status HTTP para a UI — eles lançam/retornam os erros de domínio de `errors.ts`. [Source: mentalidadeauditoria.md#6.1]
5. Erros são tratados **no boundary certo** (a camada de dados), não engolidos em silêncio nem espalhados por componentes. [Source: mentalidadeauditoria.md#5.3]
6. O `request_id`/correlation-id é preservado no erro de domínio para o usuário poder reportar e o time rastrear (Story 5.3).

## Tasks / Subtasks

- [x] Task 1: Definir o envelope de erro canônico do gateway (AC: #1, #2)
- [x] Task 2: Definir os tipos de erro de domínio (discriminated union) em `errors.ts` (AC: #3)
- [x] Task 3: Definir o contrato "repos só lançam erro de domínio" (AC: #4, #5)
- [x] Task 4: Propagar `request_id` até o erro de domínio (AC: #6) — linkar Story 5.3

## Dev Notes

- Princípio de auditoria: exceções **não** engolidas em silêncio; capturadas no boundary e traduzidas em mensagens amigáveis + logs de sistema. [Source: mentalidadeauditoria.md#5.3]
- **Zero-trust nos erros:** o front nunca decide autorização olhando o corpo do erro — ele só exibe. A decisão já foi do gateway. [Source: mentalidadeauditoria.md#5.6]
- Discriminated unions para estados de erro em vez de flags soltas (`isError`/`data|null`). [Source: mentalidadeauditoria.md#6.2]

### Project Structure Notes

- `errors.ts` mora em `src/lib/data/` (Story 1.5). É a fronteira entre transporte (gateway) e domínio (repos/UI).

### References

- [Source: mentalidadeauditoria.md#5.3] — Error handling (não engolir, traduzir no boundary)
- [Source: mentalidadeauditoria.md#5.6] — Não vazar internals/PII
- [Source: mentalidadeauditoria.md#6.2] — Discriminated unions

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Rollout de `handleDomainError` aplicado só em `Editor.tsx` (auto-save) e `Explorer.tsx` (criar/renomear/excluir/mover) — os demais call-sites de repo em outras telas ainda não têm tratamento. Verificação em runtime contra um gateway real não foi feita (Docker inacessível nesta sessão). Status `review`, não `done`.

### Completion Notes List

- Detalhe completo em `doc/architecture/04-tratamento-de-erros.md §1`. Resumo: envelope `{error:{code,message,request_id}}` implementado no mock-gateway (`errors.ts`); `knowledge/src/lib/data/errors.ts` traduz em `DomainError` (1 classe, campo `type` discriminante — AC#3); `client.ts`'s `api()` é o único ponto de tradução, repos nunca veem `Response`/status (AC#4, #5); `request_id` propagado via header `X-Request-Id` (AC#6, Story 5.3).
- `knowledge/src/lib/handleError.ts` (novo, editável) centraliza a reação de UI e já está em uso real, não só definido.

### File List

- `knowledge/src/lib/data/errors.ts` (novo, protegido)
- `knowledge/src/lib/data/client.ts` (usa `errors.ts`, timeout, retry-on-GET)
- `knowledge/src/lib/handleError.ts` (novo, editável)
- `knowledge/src/components/Editor.tsx`, `Explorer.tsx` (chamadas críticas com try/catch)
- `knowledge/masi.template.json` (`errors.ts` protegido, `handleError.ts` editável)
- `knowledge/dev/mock-gateway/src/errors.ts` (envelope + tradução pg)
- `doc/architecture/04-tratamento-de-erros.md` (novo)
