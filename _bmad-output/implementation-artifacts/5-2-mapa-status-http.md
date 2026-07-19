# Story 5.2: Mapa de status HTTP por modo de falha

Status: ready-for-dev

## Story

As a **engenheiro que trata falhas**,
I want **um mapa explícito de status HTTP para cada modo de falha do Knowledge Vault**,
so that **o front reaja corretamente (redirect no 401, toast no 403, etc.) e a semântica seja consistente**.

## Acceptance Criteria

1. É definido o mapa de status: **400** (corpo/validação inválida), **401** (sem sessão), **403** (RBAC/ownership negado), **404** (recurso inexistente), **409** (conflito de concorrência), **422** (semântica inválida, ex.: enum fora do domínio), **429** (rate limit), **500** (erro inesperado). [Source: mentalidadeauditoria.md#5.5][Source: mentalidadeauditoria.md#5.6]
2. Cada modo de falha do produto é mapeado a um status:
   - Rep tenta editar doc de outro → **403** (Story 3.4)
   - Rep tenta escrever na base compartilhada → **403** (Story 3.5)
   - Sessão expirada → **401** → front redireciona para login (Better-Auth)
   - Publicar doc-fonte inexistente → **404** (Story 4.1)
   - `target_scope` fora de `('personal','shared')` → **400/422** (Story 6.4)
   - Título/conteúdo acima do limite → **400** (Story 6.5)
   - Update com `updated_at` desatualizado → **409** (Story 6.11)
3. Está definida a política **403 vs 404** para não vazar existência de recursos de outro dono (evitar enumeração) — decisão registrada e consistente. [Source: mentalidadeauditoria.md#5.6]
4. O front mapeia status → ação: 401→login, 403→toast "sem permissão", 404→toast "não encontrado", 409→recarregar/mesclar, 429→backoff, 500→"erro inesperado, tente de novo". [Source: mentalidadeauditoria.md#6.1]
5. O mapa é **estável** e documentado junto ao envelope (Story 5.1).
6. Nenhum status carrega detalhe sensível no corpo (Story 5.1 AC#2).

## Tasks / Subtasks

- [ ] Task 1: Redigir a tabela status × significado (AC: #1)
- [ ] Task 2: Mapear cada modo de falha do produto ao status (AC: #2)
- [ ] Task 3: Decidir e documentar a política 403 vs 404 (AC: #3)
- [ ] Task 4: Definir o mapeamento status → ação de UI (AC: #4)

## Dev Notes

- Rate limiting (429) e timeouts fazem parte do checklist de APIs da auditoria — endpoints não devem ficar sem limite. [Source: mentalidadeauditoria.md#5.5]
- **Concorrência (409):** dois usuários editando o mesmo doc; salvamento automático torna isso provável. Política otimista com `updated_at` (Story 6.11). [Source: mentalidadeauditoria.md#5.2]
- 401 deve integrar com o fluxo Better-Auth (signIn) — sessão via `credentials: 'include'`. [Source: Importantdoc.md#B5][Source: Importantdoc.md#B8]

### Project Structure Notes

- Consumido por `errors.ts` (Story 5.1) para mapear status → tipo de erro de domínio.

### References

- [Source: mentalidadeauditoria.md#5.5] — APIs (rate limit, validação, timeouts)
- [Source: mentalidadeauditoria.md#5.6] — IDOR / não vazar existência
- [Source: mentalidadeauditoria.md#5.2] — Concorrência

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
