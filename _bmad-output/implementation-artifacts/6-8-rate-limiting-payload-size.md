---
baseline_commit: 6cba9cb
---

# Story 6.8: [VALIDAÇÃO] Rate limiting e tamanho máximo de corpo (payload)

Status: review

## Story

As a **responsável pela disponibilidade**,
I want **rate limiting por sessão e um limite de tamanho de corpo no gateway**,
so that **o backend resista a abuso, loops de retry e payloads gigantes**.

## Acceptance Criteria

1. Endpoints mutadores têm **rate limit** por sessão/tenant (ex.: N requests/janela); excedido → **429** com envelope (Story 5.2). [Source: mentalidadeauditoria.md#5.5]
2. Há **limite de tamanho de corpo** da request no gateway (independente dos limites de campo da Story 6.5); acima → **413/400**. [Source: mentalidadeauditoria.md#5.2][Source: mentalidadeauditoria.md#5.5]
3. Está documentado o risco que isso mitiga: salvamento automático do editor pode gerar muitas requests; limite protege contra loop e contra abuso. [Source: LOVEABLE-BRIEF.md#5.4][Source: mentalidadeauditoria.md#5.5]
4. O rate limit é **server-side** (gateway) — o front pode fazer debounce do auto-save por UX, mas não é a garantia. [Source: mentalidadeauditoria.md#5.6]
5. Está registrado que isto é responsabilidade do **gateway compartilhado**; o app só reage ao 429 com backoff (Story 5.5). [Source: Importantdoc.md#B2]
6. Leituras (`list`) também podem ter limite mais generoso — decisão registrada.

## Tasks / Subtasks

- [x] Task 1: Definir a política de rate limit (janelas, limites por rota/papel) (AC: #1, #6)
- [x] Task 2: Definir o limite de tamanho de corpo global (AC: #2)
- [x] Task 3: Documentar o vínculo com auto-save/debounce (AC: #3, #4)
- [ ] Task 4: Definir a reação do app ao 429 (backoff) (AC: #5) — linkar Story 5.5

## Dev Notes

- Checklist de APIs: "endpoints expostos sem rate limiter?" é um risco. O gateway é compartilhado por muitos tenants → rate limit protege todos. [Source: mentalidadeauditoria.md#5.5]
- Auto-save (salvar alguns segundos após parar de digitar) precisa de **debounce no front** para não spammar, mas o limite real é do gateway. [Source: LOVEABLE-BRIEF.md#5.4]
- Complementa 6.5 (tamanho de campo) no nível do envelope inteiro (payload size).

### Project Structure Notes

- Server-side (gateway). No app: debounce do auto-save (UX) + reação a 429 (Story 5.5).

### References

- [Source: mentalidadeauditoria.md#5.5] — Rate limiting, payload
- [Source: mentalidadeauditoria.md#5.2] — Network overhead
- [Source: LOVEABLE-BRIEF.md#5.4] — Salvamento automático

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Não executado contra Postgres/rede reais. Status `review`.

### Completion Notes List

- `knowledge/dev/mock-gateway/src/rateLimit.ts` (novo): janela fixa de 60s, 60 mutações por sessão (ou IP se não autenticado) — `GET` fica de fora, sem limite aqui (AC#1, #6). Excedido → 429 com o envelope padrão.
- `hono/body-limit` (built-in) em `index.ts`: 300KB de corpo, independente dos limites por campo da Story 6.5 (AC#2) — acima → 413.
- Vínculo com auto-save documentado em `05-validacao.md §6` (AC#3): o debounce de 500ms do `Editor.tsx` já existia antes desta story; o rate limit é a garantia real, o debounce é só UX (AC#4).
- **Task 4 não feita:** o app hoje **não** implementa backoff automático ao receber 429 — o erro vira toast (`DomainError` tipo `rate_limited`, mensagem "Muitas tentativas...") mas não há retry programado. `client.ts`'s retry-on-GET (Story 5.5) só dispara pra falha `unexpected`, não pra `rate_limited`. Gap sinalizado — backoff automático em 429 é mais arriscado de acertar sem validar contra um gateway real (evitar piorar um rate limit já acionado), por isso não implementei sem confirmar com o Erik.

### File List

- `knowledge/dev/mock-gateway/src/rateLimit.ts` (novo)
- `knowledge/dev/mock-gateway/src/index.ts` (`bodyLimit` + `rateLimitMutations`)
