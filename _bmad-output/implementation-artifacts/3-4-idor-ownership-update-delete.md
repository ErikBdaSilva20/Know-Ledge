---
baseline_commit: 0e6e968
---

# Story 3.4: Prevenção de IDOR — ownership em `update`/`remove` por id

Status: done

## Story

As a **responsável pela segurança**,
I want **que o gateway verifique a posse do registro antes de qualquer `PATCH`/`DELETE` por id**,
so that **um rep não consiga alterar/excluir documento de outro usuário adivinhando o id (IDOR)**.

## Acceptance Criteria

1. Está documentado o invariante: `PATCH /data/:table/:id` e `DELETE /data/:table/:id` só têm efeito se o registro pertence ao `owner_id` da sessão **ou** o papel é manager/admin. Caso contrário → **403** (não 404 silencioso que confirme existência, ver nota). [Source: mentalidadeauditoria.md#5.6][Source: Importantdoc.md#B8]
2. O front usa ids reais nos repos, mas **a autorização por id é do gateway** — o front nunca decide se "pode" alterar. [Source: Importantdoc.md#B5]
3. Um caso de teste confirma: `rep A` tentando `PATCH document/{id de rep B}` → **403/negado**, sem alteração. [Source: mentalidadeauditoria.md#5.6]
4. Está documentado que **como não há get-by-id**, o vetor de IDOR aqui é `update`/`remove` (e leitura via `list` já é cortada pela visibilidade, Story 3.3). [Source: Importantdoc.md#B5]
5. Para `shared_document` (sem owner), a autorização de `update`/`remove` cai na regra de lookup (só admin/manager) — Story 3.5.
6. A resposta de negação **não vaza** se o id existe ou não para outro dono (evitar enumeração) — decisão de status documentada (Story 5.2).

## Tasks / Subtasks

- [x] Task 1: Redigir o invariante de ownership em mutações por id (AC: #1, #2)
- [x] Task 2: Enumerar os vetores de IDOR reais dado "sem get-by-id" (AC: #4)
- [x] Task 3: Definir política de status para negação (403 vs 404) sem vazar existência (AC: #6) — linkar Story 5.2
- [x] Task 4: Casos de teste IDOR cross-owner (AC: #3) — linkar Story 7.5

## Dev Notes

- IDOR (Insecure Direct Object Reference) é P0 no framework de auditoria: "input do usuário usado direto em query sem verificar se o usuário tem autorização para aquele id específico". [Source: mentalidadeauditoria.md#5.6][Source: mentalidadeauditoria.md#7]
- Como o modo genérico é `/data/:table/:id`, o gateway precisa checar posse antes de aplicar. Este é o comportamento esperado da fundação (autz app-layer no gateway). [Source: Importantdoc.md#B1][Source: Importantdoc.md#B8]
- **Concorrência:** dois updates simultâneos no mesmo doc — ver política de conflito otimista (Story 6.11). [Source: mentalidadeauditoria.md#5.2]

### Project Structure Notes

- Complementa 3.1 (owner_id da sessão) e 3.3 (visibilidade na leitura). Testado em 7.5.

### References

- [Source: mentalidadeauditoria.md#5.6] — IDOR, authorization por id
- [Source: Importantdoc.md#B8] — visibilidade/escrita por papel
- [Source: Importantdoc.md#B5] — sem get-by-id

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- Vetores de IDOR enumerados (AC#4): só `update`/`remove` por id, já que não há `get-by-id` (leitura já cortada por visibilidade, Story 3.3).
- Auditoria de todo `*Repo.update(id, patch)`/`*Repo.remove(id)` chamado pela UI (`Editor.tsx`, `Explorer.tsx`, `workspace-doc.tsx`, `shared-doc.tsx`, `admin.tsx`, `favorites.tsx`): nenhum decide posse localmente nem manda `owner_id` — só `id` + patch de negócio. A decisão é 100% do gateway (AC#1, #2).
- Política de status 403 vs 404 (AC#6) é decisão da Story 5.2, fora deste repo — só referenciada aqui, não decidida.
- Caso de teste IDOR cross-owner (AC#3) especificado em `03-seguranca-zero-trust.md §4`/§6 — não executado (sem gateway local).

### File List

- `doc/architecture/03-seguranca-zero-trust.md` (§4)
