# Story 6.11: [VALIDAÇÃO] Concorrência, conflitos e idempotência

Status: ready-for-dev

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

- [ ] Task 1: Definir a estratégia de concorrência otimista (updated_at/version) (AC: #1, #2)
- [ ] Task 2: Definir idempotency key para Publicar (AC: #3) — linkar Stories 4.1/5.5
- [ ] Task 3: Definir unicidade de favorite (AC: #4) — linkar Story 6.6
- [ ] Task 4: Definir a reação de UI ao 409 (AC: #5)

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

### Debug Log References

### Completion Notes List

### File List
