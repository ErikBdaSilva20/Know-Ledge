# Story 6.8: [VALIDAÇÃO] Rate limiting e tamanho máximo de corpo (payload)

Status: ready-for-dev

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

- [ ] Task 1: Definir a política de rate limit (janelas, limites por rota/papel) (AC: #1, #6)
- [ ] Task 2: Definir o limite de tamanho de corpo global (AC: #2)
- [ ] Task 3: Documentar o vínculo com auto-save/debounce (AC: #3, #4)
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

### Debug Log References

### Completion Notes List

### File List
