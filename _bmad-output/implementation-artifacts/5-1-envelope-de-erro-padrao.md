# Story 5.1: Envelope de erro padrão e tradução na camada de dados

Status: ready-for-dev

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

- [ ] Task 1: Definir o envelope de erro canônico do gateway (AC: #1, #2)
- [ ] Task 2: Definir os tipos de erro de domínio (discriminated union) em `errors.ts` (AC: #3)
- [ ] Task 3: Definir o contrato "repos só lançam erro de domínio" (AC: #4, #5)
- [ ] Task 4: Propagar `request_id` até o erro de domínio (AC: #6) — linkar Story 5.3

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

### Debug Log References

### Completion Notes List

### File List
