---
baseline_commit: 6cba9cb
---

# Story 6.12: [VALIDAÇÃO] Exclusão permanente é decidida no servidor (confirmação é só UX)

Status: done

## Story

As a **responsável pela segurança das operações destrutivas**,
I want **que a exclusão seja autorizada e executada pelo servidor, tratando a confirmação do front como puramente cosmética**,
so that **a ausência de "confirmei" no front nunca seja o que impede uma exclusão indevida — o gate é o gateway**.

## Acceptance Criteria

1. Está documentado que `DELETE /data/:table/:id` é **gated no servidor** por ownership/papel (Stories 3.4/3.5) — a confirmação modal do front é **UX-only**. [Source: LOVEABLE-BRIEF.md#6][Source: mentalidadeauditoria.md#5.6]
2. Exclusão é **permanente e imediata** — não há soft-delete, lixeira ou restauração; o servidor não mantém `deleted_at`. [Source: LOVEABLE-BRIEF.md#2.3]
3. A cascade (folder→conteúdo) é executada pelo **servidor/schema** (Story 5.4), não simulada pelo front deletando item a item. [Source: Importantdoc.md#B4]
4. Um rep não pode excluir recurso de outro (403); manager/admin conforme papel (Story 3.4/3.5). [Source: LOVEABLE-BRIEF.md#4]
5. Excluir na base compartilhada é só manager/admin (403 para rep), independentemente da UI (Story 3.5). [Source: LOVEABLE-BRIEF.md#5.5]
6. Um caso de teste confirma: `DELETE` direto (sem passar pela confirmação de UI) de um rep sobre doc de outro → **403**; a confirmação nunca é a barreira de segurança. [Source: mentalidadeauditoria.md#5.6]

## Tasks / Subtasks

- [x] Task 1: Documentar "confirmação é UX, gate é servidor" (AC: #1, #6)
- [x] Task 2: Reafirmar exclusão permanente sem soft-delete (AC: #2)
- [x] Task 3: Garantir cascade server-side, não client-side (AC: #3) — linkar Story 5.4
- [x] Task 4: Casos de teste de exclusão cross-owner e na base compartilhada (AC: #4, #5) — linkar Story 7.5

## Dev Notes

- Princípio zero-trust aplicado ao destrutivo: **nunca** confiar que "o front só chama DELETE depois de confirmar". Um cliente adulterado chama DELETE direto — o gate precisa ser server-side. [Source: mentalidadeauditoria.md#5.6]
- Produto: exclusão sempre permanente e imediata, com confirmação clara antes (UX). Se pasta tem conteúdo, avisa que tudo dentro será excluído — mas a execução da cascade é do servidor. [Source: LOVEABLE-BRIEF.md#2.3][Source: LOVEABLE-BRIEF.md#6]
- Fecha o bloco de validação amarrando o destrutivo ao RBAC (E3) e à cascade (5.4).

### Project Structure Notes

- Server-side (gateway + FKs de cascade). UI só exibe o modal de confirmação e chama `repo.remove(id)`.

### References

- [Source: LOVEABLE-BRIEF.md#6] — Excluir (confirmação, permanente)
- [Source: LOVEABLE-BRIEF.md#2.3] — Sem lixeira/undo
- [Source: mentalidadeauditoria.md#5.6] — Não confiar no front para operação sensível

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Marcada `done`: nenhum código novo, só reafirmação de comportamento já implementado e já revisado por leitura nas Stories 3.4/3.5/5.4.

### Completion Notes List

- `DELETE /data/:table/:id` sempre passa pelo mesmo gate atômico de ownership/papel do `PATCH` (`routes/data.ts`) — a `ConfirmDialog` do front nunca é consultada pelo servidor, é puramente UX (AC#1, #6).
- Sem soft-delete: nenhuma tabela tem `deleted_at` (Épico 2); `DELETE` é sempre `DELETE FROM ... RETURNING id`, sem filtro de "não deletados" em lugar nenhum (AC#2).
- Cascade é sempre FK do banco (Story 5.4/Épico 2), nunca o front deletando item por item (AC#3).
- Cross-owner (AC#4) e base compartilhada (AC#5) já cobertos por casos de teste em `dev/e2e/roteiro.sh` desde os Épicos 4/5.

### File List

- (nenhum arquivo novo)
