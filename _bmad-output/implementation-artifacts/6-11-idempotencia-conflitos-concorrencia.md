---
baseline_commit: 6cba9cb
---

# Story 6.11: [VALIDAÇÃO] Concorrência, conflitos e idempotência

Status: review

## Story

As a **responsável pela consistência sob concorrência**,
I want **política de conflito otimista e idempotência em operações críticas**,
so that **edições simultâneas e duplo-clique não corrompam nem dupliquem dados**.

## Acceptance Criteria

1. `update` de `document`/`shared_document` usa **concorrência otimista** via `updated_at` (ou versão): se o `updated_at` enviado não bate com o do banco → **409** (Story 5.2). [Source: mentalidadeauditoria.md#5.2]
2. Está documentado o cenário: salvamento automático + manager/admin editando o mesmo doc → risco de sobrescrita cega; a política otimista evita perda silenciosa. [Source: LOVEABLE-BRIEF.md#5.4][Source: mentalidadeauditoria.md#5.2]
3. A rota **Publicar** (Story 4.1) é **idempotente** via idempotency key (duplo-clique não cria dois `shared_document`). [Source: mentalidadeauditoria.md#5.5]
4. `favorite` tem **unicidade** (owner+scope+document) → favoritar duas vezes não duplica (índice único + tratamento de 409, Story 6.6). [Source: mentalidadeauditoria.md#5.4]
5. Está definida a reação do front ao 409: recarregar o estado atual e oferecer re-aplicar a edição (nunca sobrescrever cegamente). [Source: mentalidadeauditoria.md#6.1]
6. Leituras são idempotentes; retry seguro só em GET (Story 5.5). [Source: mentalidadeauditoria.md#5.5]

## Tasks / Subtasks

- [x] Task 1: Definir a estratégia de concorrência otimista (updated_at/version) (AC: #1, #2)
- [x] Task 2: Definir idempotency key para Publicar (AC: #3) — linkar Stories 4.1/5.5
- [x] Task 3: Definir unicidade de favorite (AC: #4) — linkar Story 6.6
- [x] Task 4: Definir a reação de UI ao 409 (AC: #5)

## Dev Notes

- Concorrência é item do checklist de performance/escala: "como o sistema lida com dois usuários atualizando o mesmo recurso? otimista ou pessimista?". Aqui, **otimista** (menos travamento, adequado a doc de conhecimento). [Source: mentalidadeauditoria.md#5.2]
- Auto-save aumenta a chance de corrida; sem política, a última escrita vence e apaga a outra silenciosamente — inaceitável. [Source: LOVEABLE-BRIEF.md#5.4]
- Idempotência protege Publicar e qualquer create sensível a retry. [Source: mentalidadeauditoria.md#5.5]

### Project Structure Notes

- Server-side (gateway) para 409/idempotência; UI reage no componente de editor. Unicidade de favorite no schema (índice único, Story 2.3/6.6).

### References

- [Source: mentalidadeauditoria.md#5.2] — Concorrência (otimista/pessimista)
- [Source: mentalidadeauditoria.md#5.5] — Idempotência
- [Source: LOVEABLE-BRIEF.md#5.4] — Salvamento automático

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Não executado contra Postgres real. Status `review`. A lógica de 409 vs 404 em `routes/data.ts` faz uma segunda query pra distinguir os dois casos quando `expected_updated_at` foi enviado — não é perfeitamente atômica (pequena janela entre o `UPDATE` falhar e o `SELECT` de diagnóstico), aceitável pra um harness local, mas vale revalidar sob carga real.

### Completion Notes List

- **Concorrência otimista (AC#1, #2), ponta-a-ponta:** `PATCH` de `documents`/`shared_documents` aceita `expected_updated_at` opcional; se enviado e não bater com o valor atual no banco → **409**. Implementado em `schemas.ts` (campo do schema de update) + `routes/data.ts` (na `WHERE` da query, com um `SELECT` de diagnóstico só quando há mismatch, pra decidir 409 vs 404 sem vazar existência indevidamente). No app: `Editor.tsx` guarda `lastKnownUpdatedAt` (seteado ao carregar o doc e após cada save bem-sucedido) e manda de volta no próximo save — `documentsRepo.update()`/`sharedDocumentsRepo.update()` ganharam um 3º parâmetro opcional `{expectedUpdatedAt}` pra isso.
- Idempotência do Publicar (AC#3) e unicidade de favorito (AC#4) — **nada novo**, já entregues nas Stories 5.5 e 2.3/5.5 respectivamente. Não implementadas de novo, só referenciadas.
- **Reação de UI ao 409 (AC#5) — parcial:** `handleDomainError` já mostra "Este item foi alterado em outro lugar. Recarregue e tente de novo." (mensagem definida na Story 5.1). O que falta: recarregar automaticamente o estado atual e oferecer reaplicar a edição pendente — hoje o usuário só é avisado, a edição em andamento no textarea não é preservada nem mesclada. Sinalizado como gap explícito, não fiz um fluxo de merge sem validar com o Erik se vale o esforço.
- Retry só em GET (AC#6) — já da Story 5.5.

### File List

- `knowledge/dev/mock-gateway/src/schemas.ts` (`expected_updated_at`)
- `knowledge/dev/mock-gateway/src/routes/data.ts` (lógica de 409 vs 404)
- `knowledge/src/lib/data/documents.repo.ts`, `sharedDocuments.repo.ts` (`update()` com `opts`)
- `knowledge/src/components/Editor.tsx` (`lastKnownUpdatedAt`)
- `knowledge/dev/e2e/roteiro.sh` (caso novo)
