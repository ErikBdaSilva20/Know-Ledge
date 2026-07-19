# Story 1.5: Camada de dados isolada ("controllers") — jamais junto do fluxo de UI

Status: ready-for-dev

## Story

As a **arquiteto do Knowledge Vault**,
I want **toda a lógica que fala com o backend isolada em `src/lib/data/`, separada das telas e componentes**,
so that **a UI nunca dependa de detalhes de transporte, e trocar mock→gateway seja uma mudança local sem tocar em tela**.

## Acceptance Criteria

1. É estabelecido o **invariante arquitetural**: nenhum componente de UI (`src/screens/**`, `src/components/**`) faz fetch, monta header, trata status HTTP, ou conhece `db`/`auth` diretamente. Tudo isso vive em `src/lib/data/`. [Source: mentalidadeauditoria.md#6.1][Source: Importantdoc.md#B5]
2. A estrutura da camada de dados é definida na **raiz** de `src/lib/data/` (decisão do Erik):
   - `client.ts` (protegido — contrato do gateway)
   - `types.gen.ts` (protegido — tipos do schema)
   - `errors.ts` (traduz erro do gateway → erro de domínio; Story 5.1/5.2)
   - `<entidade>.repo.ts` — 1 por entidade: `documents`, `folders`, `sharedDocuments`, `references`, `favorites`
3. Cada repo expõe **só verbos de domínio** (ex.: `listDocuments()`, `createDocument(input)`, `toggleFavorite(...)`), nunca vaza `Response`/`fetch`/status para a UI. [Source: mentalidadeauditoria.md#5.3]
4. Os repos **não** contêm lógica de apresentação (formatação de data, cor de badge) — isso fica em `format.ts`/componentes. Separação I/O ↔ domínio ↔ view. [Source: mentalidadeauditoria.md#6.1]
5. Derivações (backlinks, grafo, busca, recentes) ficam em **módulos de domínio puros** (funções sem I/O) que recebem listas já carregadas pelos repos — testáveis isoladamente. [Source: LOVEABLE-BRIEF.md#3]
6. O invariante é verificável: uma checagem (lint/rule ou revisão) garante que `src/screens`/`src/components` não importam `client.ts` diretamente — só repos.

## Tasks / Subtasks

- [ ] Task 1: Definir a árvore de `src/lib/data/` e o papel de cada arquivo (AC: #2)
- [ ] Task 2: Especificar a interface de cada repo (verbos de domínio) (AC: #3)
  - [ ] Subtask 2.1: `documents.repo.ts`, `folders.repo.ts`, `sharedDocuments.repo.ts`, `references.repo.ts`, `favorites.repo.ts`
- [ ] Task 3: Definir módulos de domínio puros para derivações (AC: #5)
  - [ ] Subtask 3.1: `graph.ts` (nós+arestas), `backlinks.ts`, `search.ts` — sem I/O
- [ ] Task 4: Definir a regra de fronteira UI↛client.ts (AC: #1, #6)

## Dev Notes

- Esta story materializa o pedido do Erik: "separar controllers numa pasta específica pra tudo que for backend, jamais junto do fluxo da UI". No mundo MasIA, "controllers do app" = **camada de dados** (repos + client + tradução de erro). Os controllers *server-side de verdade* (que setam `owner_id` e aplicam RBAC) vivem no gateway, fora deste repo. [Source: Importantdoc.md#B2][Source: Importantdoc.md#B5]
- **Por que raiz e não `controllers/`:** o `editable.allow` do manifest usa `src/lib/data/*.repo.ts` (glob raso). Repos na raiz são editáveis pela IA; uma subpasta exigiria mudar o glob para `**` e alinhar com o dono do gateway. Decisão: manter na raiz. [Source: Importantdoc.md#B7]
- O brief já pediu essa camada: "crie uma camada de 'repositórios' que hoje mexe no mock, mas tem a cara de uma chamada de API". [Source: LOVEABLE-BRIEF.md#2.2]

### Project Structure Notes

```
src/lib/data/
  client.ts            (PROTEGIDO)
  types.gen.ts         (PROTEGIDO)
  errors.ts            (tradução de erro — Story 5.1)
  documents.repo.ts
  folders.repo.ts
  sharedDocuments.repo.ts
  references.repo.ts
  favorites.repo.ts
  domain/
    graph.ts           (puro)
    backlinks.ts       (puro)
    search.ts          (puro)
src/screens/**         -> consomem só repos + domain
src/components/**       -> apresentação, sem I/O
```

### References

- [Source: Importantdoc.md#B5] — db genérico e repos
- [Source: Importantdoc.md#B7] — allow/protect (glob raso dos repos)
- [Source: LOVEABLE-BRIEF.md#2.2] — camada de repositórios com cara de API
- [Source: mentalidadeauditoria.md#6.1] — separação lógica/UI, business logic em hooks/serviços

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
