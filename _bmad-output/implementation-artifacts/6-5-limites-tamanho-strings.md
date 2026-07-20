---
baseline_commit: 6cba9cb
---

# Story 6.5: [VALIDAÇÃO] Limites de tamanho — título, nome e conteúdo

Status: review

## Story

As a **responsável pela robustez e custo**,
I want **limites de tamanho aplicados no servidor para strings e conteúdo Markdown**,
so that **payloads gigantes não estourem memória/custo do Neon nem quebrem o list-then-filter no front**.

## Acceptance Criteria

1. `document.title` e `folder.name` têm **limite máximo** (ex.: 200–300 chars) e mínimo (não vazio para `name`; `title` pode ter default). Acima → **400**. [Source: mentalidadeauditoria.md#5.5]
2. `document.content` (Markdown) tem **limite de tamanho** definido (ex.: N KB/MB) — validado no servidor. [Source: mentalidadeauditoria.md#5.2][Source: mentalidadeauditoria.md#5.5]
3. `shared_document.title`/`content` seguem os mesmos limites. [Source: LOVEABLE-BRIEF.md#3]
4. Os limites são **constantes centralizadas** (não valores mágicos espalhados). [Source: mentalidadeauditoria.md#5.3]
5. Está documentado o impacto de não limitar: como toda tela carrega a **lista inteira** (list-then-filter), documentos enormes degradam todas as telas — o limite protege a performance de leitura. [Source: Importantdoc.md#B5][Source: mentalidadeauditoria.md#5.2]
6. O limite total do corpo da request também é coberto (Story 6.8, payload size) — esta story cobre os campos; a 6.8 cobre o envelope.

## Tasks / Subtasks

- [x] Task 1: Definir limites por campo (title, name, content) (AC: #1, #2, #3)
- [x] Task 2: Centralizar os limites como constantes (AC: #4)
- [x] Task 3: Documentar o impacto no list-then-filter (AC: #5)
- [x] Task 4: Delimitar fronteira com payload-size (Story 6.8) (AC: #6)

## Dev Notes

- Sem paginação nem filtro server-side (modo genérico), a lista inteira vem sempre — content grande multiplica o custo em toda leitura. Limite de tamanho é performance **e** segurança (DoS por payload). [Source: Importantdoc.md#B5][Source: mentalidadeauditoria.md#5.2]
- Magic values proibidos: os limites viram constantes nomeadas. [Source: mentalidadeauditoria.md#5.3]
- Busca é só por título em memória — títulos enormes também pesam. [Source: LOVEABLE-BRIEF.md#3]

### Project Structure Notes

- Constantes de limite compartilhadas entre schema de validação (gateway) e, se houver, hint de UX no editor (contador de caracteres).

### References

- [Source: mentalidadeauditoria.md#5.5] — Validação de tamanho
- [Source: mentalidadeauditoria.md#5.2] — Data volume / payload
- [Source: Importantdoc.md#B5] — list-then-filter (lista inteira)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Não executado contra Postgres real. Status `review`. Números escolhidos (title 300, name 200, content 200KB) são um julgamento razoável, não vieram de um requisito numérico do produto — ajustáveis sem quebrar nada além de `LIMITS` em `schemas.ts`.

### Completion Notes List

- `LIMITS = { NAME_MAX: 200, TITLE_MAX: 300, CONTENT_MAX: 200_000 }` em `knowledge/dev/mock-gateway/src/schemas.ts` — constantes nomeadas, não valores mágicos espalhados (AC#4).
- `title`/`name` exigem `min(1)` (não vazio) além do máximo (AC#1). `content` só tem máximo, pode ser vazio (documento novo) (AC#2). `shared_documents` usa os mesmos limites (AC#3).
- Impacto no list-then-filter (AC#5) documentado em `doc/architecture/05-validacao.md §3` — sem paginação nem filtro server-side, todo `GET` carrega a lista inteira; um `content` sem limite multiplicaria custo em toda tela.
- Fronteira com Story 6.8 (AC#6): esta story limita **campos**; 6.8 limita o **corpo inteiro** da request — implementadas juntas nesta sessão, mas são checks independentes (schema Zod vs. `hono/body-limit`).
- Caso de teste novo em `dev/e2e/roteiro.sh`: título com 400 chars (limite 300) → 400.

### File List

- `knowledge/dev/mock-gateway/src/schemas.ts`
- `knowledge/dev/e2e/roteiro.sh` (caso novo)
