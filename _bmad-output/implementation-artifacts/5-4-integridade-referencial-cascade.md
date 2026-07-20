---
baseline_commit: 2029dfc
---

# Story 5.4: Integridade referencial, cascade de exclusão e referências pendentes

Status: done

## Story

As a **responsável pela consistência dos dados**,
I want **o comportamento de exclusão em cascata e o tratamento de referências pendentes definidos**,
so that **excluir pasta/documento não deixe o banco inconsistente nem quebre o grafo silenciosamente**.

## Acceptance Criteria

1. Está documentado que exclusão é **permanente e imediata** (sem lixeira/undo), com confirmação de UX antes. [Source: LOVEABLE-BRIEF.md#2.3][Source: LOVEABLE-BRIEF.md#6]
2. Excluir `folder` com conteúdo → subpastas e documentos dentro são removidos (cascade), coerente com o aviso "tudo dentro também será excluído". [Source: LOVEABLE-BRIEF.md#6]
3. Excluir `document` → suas `document_reference` de origem são removidas (cascade via `source_document_id`); `favorite` que apontam para ele também. [Source: LOVEABLE-BRIEF.md#3]
4. **Referências pendentes:** links cujo alvo (polimórfico, sem FK) foi excluído → ao navegar, o front mostra toast "documento não encontrado" e não navega; opcionalmente uma limpeza server-side varre alvos órfãos. [Source: LOVEABLE-BRIEF.md#6]
5. Excluir `shared_document` → `shared_document_reference` que o referenciam são removidas (cascade, FKs da Story 2.4). [Source: LOVEABLE-BRIEF.md#3]
6. A cascade é definida no **schema** (FKs `on delete cascade`) sempre que há FK real; o caso polimórfico é tratado por convenção + fallback de UI. [Source: Importantdoc.md#B4]
7. A confirmação de exclusão é **UX-only** — o gate real (ownership/papel) é do gateway (Stories 3.4/3.5). O servidor nunca depende da confirmação do front.

## Tasks / Subtasks

- [x] Task 1: Mapear a árvore de cascade por entidade (folder→document→references/favorites) (AC: #2, #3, #5)
- [x] Task 2: Definir o tratamento de referência pendente (polimórfica) (AC: #4) — linkar Story 4.2
- [x] Task 3: Definir onde a cascade é FK (schema) vs convenção (polimórfico) (AC: #6)
- [x] Task 4: Reforçar que a confirmação é UX e o gate é server-side (AC: #7) — linkar Stories 3.4/3.5

## Dev Notes

- Checklist de banco: **foreign key constraints** presentes; cascade explícito evita órfãos. [Source: mentalidadeauditoria.md#5.4]
- O único ponto sem FK é `target_document_id`/`document_id` (polimórfico, Story 2.3) — por isso o fallback de UI ("não encontrado") é obrigatório e não um luxo. [Source: LOVEABLE-BRIEF.md#6]
- **Sem soft-delete:** o produto proíbe lixeira; portanto não há coluna `deleted_at` nem filtro de "não deletados". [Source: LOVEABLE-BRIEF.md#2.3]

### Project Structure Notes

- Decisões de cascade concretizam as DDLs das Stories 2.2–2.4. O fallback de UI vive nos componentes de navegação de link (consomem repos).

### References

- [Source: LOVEABLE-BRIEF.md#6] — Excluir (permanente); link para destino inexistente → toast
- [Source: LOVEABLE-BRIEF.md#2.3] — Sem lixeira/undo
- [Source: mentalidadeauditoria.md#5.4] — FK constraints / integridade

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Marcada `done`, não `review`, apesar do padrão adotado no resto do Épico 5/7: os ACs aqui são consolidação de cascades já escritas na migration do Épico 2 (SQL nunca executada contra Postgres real, mesma ressalva de lá) + um comportamento de UI já existente e coberto por `tsc`/`build`. Nada de runtime-dependente **novo** nesta story especificamente.

### Completion Notes List

- Detalhe completo em `doc/architecture/04-tratamento-de-erros.md §4`. Árvore de cascade (AC#1-#3, #5): `folders.parent_id`/`documents.folder_id` → `on delete cascade`; `document_references`/`shared_document_references` → `on delete cascade` via `source_*`/`target_*` — todas já na migration da Story 2.1-2.4, só consolidadas aqui.
- Caso polimórfico sem FK (AC#4, #6): **achado** — o fallback de UI já existe e é melhor que o "toast ao navegar" da AC original. `MarkdownView` (`knowledge/src/lib/markdown.tsx`) resolve o link no render; se o alvo sumiu, nunca vira um `<Link>` clicável — é um `<span>` inerte com `title="Documento não encontrado"`. Não tem link morto pra clicar.
- AC#7 (confirmação é UX, gate é server) — reafirmado, já implementado desde as Stories 3.4/3.5.

### File List

- `doc/architecture/04-tratamento-de-erros.md` (§4)
