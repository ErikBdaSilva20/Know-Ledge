---
baseline_commit: 2029dfc
---

# Story 5.5: Tradução de erros de banco, timeouts e idempotência

Status: review

## Story

As a **engenheiro tornando o backend resiliente**,
I want **erros de banco traduzidos, timeouts explícitos e operações críticas idempotentes**,
so that **falhas de infra virem mensagens limpas e duplo-clique não crie dados duplicados**.

## Acceptance Criteria

1. Erros de constraint do Postgres (violação de FK, CHECK, unique) são **traduzidos** para erros de domínio claros (Story 5.1) — nunca a mensagem crua do driver vaza para o cliente. [Source: mentalidadeauditoria.md#5.3][Source: mentalidadeauditoria.md#5.6]
2. Chamadas do app ao gateway têm **timeout explícito e curto**; timeout vira erro de domínio (não trava a UI). [Source: mentalidadeauditoria.md#5.5]
3. Operações mutadoras críticas (**Publicar**, Story 4.1) usam **idempotency key** para evitar duplicação em retry/duplo-clique. [Source: mentalidadeauditoria.md#5.5]
4. Conexões de banco no gateway são gerenciadas via **pool** (por request, não por query) — decisão de infra registrada. [Source: mentalidadeauditoria.md#5.2][Source: mentalidadeauditoria.md#5.4]
5. Está documentado que o Neon é **scale-to-zero**: a primeira request após ociosidade pode ter cold start; o app trata latência inicial com estado de loading, não com erro. [Source: Importantdoc.md#B1]
6. Erros transitórios (5xx/timeout) podem ter **retry com backoff** limitado nas leituras idempotentes (GET), nunca em POST não-idempotente sem idempotency key. [Source: mentalidadeauditoria.md#5.5]

## Tasks / Subtasks

- [x] Task 1: Mapear erros de constraint do Postgres → erros de domínio (AC: #1) — linkar Story 5.1
- [x] Task 2: Definir timeouts e o tratamento de timeout no repo (AC: #2)
- [x] Task 3: Definir idempotency key para Publicar (AC: #3) — linkar Stories 4.1/6.11
- [x] Task 4: Registrar pool de conexões e cold start do Neon (AC: #4, #5)
- [x] Task 5: Definir política de retry/backoff (só GET idempotente) (AC: #6)

## Dev Notes

- Checklist de APIs: timeouts explícitos e curtos em integrações; idempotência em endpoints mutadores. [Source: mentalidadeauditoria.md#5.5]
- Checklist de banco: conexões via pool, ciclo de vida por request. Isto é do gateway (server-side), não do app. [Source: mentalidadeauditoria.md#5.4]
- Neon "1 banco por cliente, scale-to-zero" implica cold start — importante para a UX de loading e para o teste no tenant-local (E7). [Source: Importantdoc.md#B1]
- **Não** fazer retry cego de POST de create sem idempotency — risco de duplicar documento/publicação. [Source: mentalidadeauditoria.md#5.5]

### Project Structure Notes

- Idempotência conecta com Story 6.11 (conflitos/concorrência). Timeouts vivem no `client.ts`/repos (transporte).

### References

- [Source: mentalidadeauditoria.md#5.5] — Timeouts, idempotência, retry
- [Source: mentalidadeauditoria.md#5.4] — Connection pool / lifecycle
- [Source: mentalidadeauditoria.md#5.3] — Tradução de exceções
- [Source: Importantdoc.md#B1] — Neon scale-to-zero

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Nada disto rodou contra Postgres/rede reais nesta sessão (Docker inacessível) — `translatePgError`, o timeout e a idempotency key foram revisados por leitura, não observados em runtime. Status `review`.

### Completion Notes List

- Detalhe completo em `doc/architecture/04-tratamento-de-erros.md §5`. `translatePgError()` mapeia `23505/23503/23514` → 400/409 sem vazar a constraint/coluna interna (AC#1). Timeout de 10s via `AbortController` em `client.ts` (AC#2). `Idempotency-Key` em `POST /shared/publish`, cache in-memory de 10min (AC#3) — **gap:** a UI ainda não gera essa chave no clique de "Publicar", sinalizado em `04-tratamento-de-erros.md §5`. Pool via `pg.Pool` (AC#4). Cold-start do Neon documentado como N/A local, nota pra quando plugar no Neon real (AC#5). Retry único em `list()` (GET) só pra falha `unexpected`, nunca em mutação (AC#6).
- `dev/e2e/roteiro.sh` ganhou 2 casos novos: envelope de erro tem `code`/`request_id`, e duplo-clique com a mesma `Idempotency-Key` devolve o mesmo `shared_document`.

### File List

- `knowledge/dev/mock-gateway/src/errors.ts` (`translatePgError`)
- `knowledge/dev/mock-gateway/src/idempotency.ts` (novo)
- `knowledge/dev/mock-gateway/src/routes/publish.ts` (idempotency key)
- `knowledge/src/lib/data/client.ts` (timeout, retry-on-GET)
- `knowledge/dev/e2e/roteiro.sh` (2 casos novos)
- `doc/architecture/04-tratamento-de-erros.md` (§5)
