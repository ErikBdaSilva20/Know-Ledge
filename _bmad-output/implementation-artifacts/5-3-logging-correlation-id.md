---
baseline_commit: 2029dfc
---

# Story 5.3: Logging estruturado, correlation-id e observabilidade (sem PII)

Status: review

## Story

As a **operador do backend**,
I want **logs estruturados com correlation-id e sem PII/segredos**,
so that **falhas sejam diagnosticáveis sem expor dados sensíveis nem depender de prints soltos**.

## Acceptance Criteria

1. Toda request no gateway carrega um **`request_id`** (correlation-id) gerado no boundary e devolvido no envelope de erro (Story 5.1). [Source: mentalidadeauditoria.md#5.5]
2. Logs são **estruturados** (chave/valor ou JSON), com: `request_id`, rota, método, status, papel (não o user completo), tenant, duração. [Source: mentalidadeauditoria.md#5.1][Source: mentalidadeauditoria.md#5.6]
3. **Nunca logar**: senha, token de sessão, conteúdo sensível de documento em massa, PII desnecessária, `X-Tenant-Id` combinado a segredos. [Source: mentalidadeauditoria.md#5.6]
4. Erros 5xx são logados com stack trace **no servidor** (não no cliente) — o cliente recebe só mensagem amigável + `request_id`. [Source: mentalidadeauditoria.md#5.3]
5. Está documentado o mínimo de observabilidade para o tenant-local (E7): ver os logs no `docker compose logs` com o mesmo formato. [Source: mentalidadeauditoria.md#5.1]
6. Está registrado que logging é responsabilidade do **gateway** (server-side); o app front não implementa logging de segurança.

## Tasks / Subtasks

- [x] Task 1: Definir o formato de log estruturado e os campos (AC: #1, #2)
- [x] Task 2: Definir a lista de "nunca logar" (AC: #3)
- [x] Task 3: Definir o tratamento de 5xx (stack no server, mensagem no cliente) (AC: #4) — linkar Story 5.1
- [x] Task 4: Alinhar observabilidade mínima do tenant-local (AC: #5) — linkar Story 7.1

## Dev Notes

- Checklist de auditoria: monitoramento/observabilidade e "sensitive data não logada em plaintext". [Source: mentalidadeauditoria.md#5.1][Source: mentalidadeauditoria.md#5.6]
- O `request_id` é a ponte entre o erro que o usuário vê e o log que o time investiga (Story 5.1 AC#6).
- Como o backend é o gateway compartilhado, o padrão de log deve seguir o do gateway; para o tenant-local, reproduzir o mesmo formato ajuda a testar o fluxo de erro. [Source: Importantdoc.md#B2]

### Project Structure Notes

- Server-side (gateway). No app, só a propagação do `request_id` no erro de domínio (Story 5.1).

### References

- [Source: mentalidadeauditoria.md#5.1] — Infra & DevOps / observabilidade
- [Source: mentalidadeauditoria.md#5.3] — Error handling (logs de sistema)
- [Source: mentalidadeauditoria.md#5.6] — Sensitive data não logada

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- `docker compose logs -f gateway` (AC#5) não pôde ser verificado ao vivo — stack não subiu nesta sessão. O formato do log foi revisado por leitura de `logging.ts`, não observado rodando. Status `review`.

### Completion Notes List

- `knowledge/dev/mock-gateway/src/logging.ts` (novo): middleware `requestId` (gera + expõe `X-Request-Id`) e `accessLog` (1 linha JSON por request: `request_id`, `method`, `route`, `status`, `role`, `tenant`, `duration_ms` — nunca corpo/senha/token, AC#1-3).
- 5xx: stack logado só no servidor via `console.error` em `index.ts`'s `onError`; cliente recebe mensagem amigável + `request_id` (AC#4).
- Responsabilidade 100% do gateway (AC#6) — o app só propaga `request_id` recebido no `DomainError`, não implementa logging próprio.

### File List

- `knowledge/dev/mock-gateway/src/logging.ts` (novo)
- `knowledge/dev/mock-gateway/src/index.ts` (middlewares + onError atualizado)
