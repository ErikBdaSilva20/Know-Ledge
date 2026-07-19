# Story 7.5: Roteiro de teste E2E local dos fluxos (incl. casos negativos de segurança)

Status: ready-for-dev

## Story

As a **Erik validando a integração**,
I want **um roteiro de teste E2E contra o tenant-local cobrindo fluxos felizes e os casos negativos de zero-trust**,
so that **eu confirme que a segurança realmente vive no backend antes de plugar no gateway real**.

## Acceptance Criteria

1. **Fluxos felizes** cobertos: login (Better-Auth), criar pasta/documento, auto-save, criar referência `[[`, ver backlinks, favoritar, grafo, busca por título, e (manager/admin) **Publicar** na base compartilhada. [Source: LOVEABLE-BRIEF.md#6][Source: LOVEABLE-BRIEF.md#5]
2. **Casos negativos de segurança** (o núcleo) — todos devem ser **bloqueados pelo servidor**:
   - Rep vê só os próprios docs; rep A não vê docs de rep B (3.3). [Source: mentalidadeauditoria.md#5.6]
   - Rep tenta `PATCH`/`DELETE` doc de rep B → 403 (3.4).
   - Rep tenta escrever em `shared_document` → 403 (3.5).
   - `create document { owner_id: <outro> }` → owner vira o da sessão / 400 (3.1/6.2).
   - `role` forjado para admin no front → nenhuma permissão extra (3.2).
   - `X-Tenant-Id` de outro tenant → negado (6.9).
   - `target_scope` inválido → 400/422 (6.4); id não-UUID → 400 (6.10).
   - Duplo-clique em Publicar → 1 só `shared_document` (6.11).
3. Cada caso tem **resultado esperado** (status + efeito no banco) e é reproduzível via `docker compose` + seed (Stories 7.1/7.3).
4. Falhas retornam o **envelope de erro** correto (5.1) com o status certo (5.2) e sem vazar internals.
5. O roteiro é a **prova viva do zero-trust**: se qualquer caso negativo passar, a segurança está no lugar errado (front) e deve ser corrigida no gateway.
6. Está documentado que passar o roteiro no tenant-local **não** dispensa revalidar contra o gateway real antes de produção (risco de drift do mock, Story 7.2).

## Tasks / Subtasks

- [ ] Task 1: Escrever os casos de fluxo feliz com passos e asserts (AC: #1)
- [ ] Task 2: Escrever os casos negativos de segurança com status esperado (AC: #2, #4)
- [ ] Task 3: Amarrar cada caso ao seed/compose reproduzível (AC: #3)
- [ ] Task 4: Marcar o roteiro como gate de zero-trust e a ressalva de drift (AC: #5, #6)

## Dev Notes

- Este roteiro é onde os invariantes das Stories 3.x e 6.x deixam de ser texto e viram **teste executável** — a razão de existir do tenant-local. [Source: mentalidadeauditoria.md#5.6]
- Cobrir **dois reps** (do seed, 7.3) é essencial para os casos cross-owner. [Source: LOVEABLE-BRIEF.md#4]
- Priorização (auditoria §7): os casos negativos de segurança são **P0** — um que passe indevidamente é bug crítico. [Source: mentalidadeauditoria.md#7]

### Project Structure Notes

- `dev/e2e/` (roteiro + eventuais scripts). Pode evoluir para testes automatizados depois (fora do escopo desta fase).

### References

- [Source: LOVEABLE-BRIEF.md#6] — Fluxos principais
- [Source: LOVEABLE-BRIEF.md#5] — Telas
- [Source: mentalidadeauditoria.md#5.6] — Casos de segurança
- [Source: mentalidadeauditoria.md#7] — Priorização (segurança P0)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
