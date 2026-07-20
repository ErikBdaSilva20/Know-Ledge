---
baseline_commit: 6de259e96aa22e09d3e6abdf7c005d4f5eebf364
---

# Story 1.2: Contrato de dados `/data/:table` (4 operações, sem get-by-id, sem filtro no servidor)

Status: done

## Story

As a **engenheiro integrando a camada de dados**,
I want **o contrato do modo genérico do gateway documentado e refletido no desenho de todas as telas**,
so that **nenhuma tela dependa de operações que o gateway não oferece, evitando redesenho caro na hora de reconectar**.

## Acceptance Criteria

1. O contrato é declarado como **exatamente 4 operações por tabela**: `list`, `create`, `update(id, patch)`, `remove(id)` — via `GET/POST/PATCH/DELETE /data/:table`. [Source: Importantdoc.md#B5]
2. Está documentado que **NÃO existe get-by-id nem filtro por query** no modo genérico. Toda tela faz **list-then-find/filter no front**. [Source: Importantdoc.md#B5][Source: LOVEABLE-BRIEF.md#2.2]
3. Está documentado que **joins ricos não existem** — o modo genérico é plano; relações se resolvem por (a) modelar plano, (b) 2 queries no front, ou (c) endpoint explícito no gateway (extensão). [Source: Importantdoc.md#B5]
4. Está documentado que **`owner_id` é setado pelo gateway a partir da sessão** — nunca enviado pelo front. [Source: Importantdoc.md#B5] (aprofundado em Story 3.1)
5. Uma auditoria das telas do brief confirma que **nenhuma** depende de "buscar 1 item por id no servidor" ou "mandar filtro pro servidor": Busca, Grafo, Backlinks e Recentes são todos derivados no cliente. [Source: LOVEABLE-BRIEF.md#3][Source: LOVEABLE-BRIEF.md#5.6]
6. Os pontos de risco (telas que "parecem" precisar de get-by-id — ex.: abrir documento por rota `/doc/:id`) são listados com a mitigação: carregar a lista e achar o item em memória.

## Tasks / Subtasks

- [x] Task 1: Documentar a superfície da API de dados (AC: #1, #2, #3) [Source: Importantdoc.md#B5]
  - [x] Subtask 1.1: Assinatura de `db.table<R>(name)` com `list/create/update/remove`
  - [x] Subtask 1.2: Nota dura "sem get-by-id, sem filtro server-side, sem join"
- [x] Task 2: Auditar cada tela do brief contra o contrato (AC: #5, #6) [Source: LOVEABLE-BRIEF.md#5]
  - [x] Subtask 2.1: Workspace, Base Compartilhada, Busca, Grafo, Favoritos/Recentes, Admin
  - [x] Subtask 2.2: Mapear a rota `/doc/:id` para "list + find" (deep-link resolve em memória)
- [x] Task 3: Registrar os 3 caminhos para relações (plano / 2 queries / extensão) (AC: #3)

## Dev Notes

- O brief já anteviu isso: "estruture toda tela pensando em 'carreguei a lista inteira, e filtro no frontend'". [Source: LOVEABLE-BRIEF.md#2.2]
- Entidades do Knowledge Vault que exigem "2 queries no front" para exibir relação: card de documento mostrando nome da pasta (`folder_id` → nome), backlinks (referências cujo alvo é X). Modelar plano e resolver em memória.
- **Anti-requisito:** não desenhar autocomplete de referência (`[[`) que consulte o servidor por termo — carregar a lista de documentos uma vez e filtrar localmente. [Source: LOVEABLE-BRIEF.md#5.4]

### Project Structure Notes

- O `db` vem de `src/lib/data/client.ts` (protegido). Repos por entidade consomem `db.table(...)` (Story 1.5).

### References

- [Source: Importantdoc.md#B5] — Como o app lê/escreve (o `db` genérico) e limites
- [Source: LOVEABLE-BRIEF.md#2.2] — Regras de dados (list-then-filter)
- [Source: LOVEABLE-BRIEF.md#3] — Regras derivadas (backlinks/grafo/busca calculados)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- AC#1–#4 já estavam documentados em `doc/architecture/01-stack-e-modelagem.md` §2 (Aprovado) — não duplicado; a implementação concreta é `knowledge/src/lib/data/client.ts` (`db.table<R>()` só expõe `list/create/update/remove`, sem `getById`, sem filtro, sem join).
- Auditoria de telas (AC#5, #6) confirmada por leitura do código: `workspace-doc.tsx` (`useDb((s) => s.documents.find((d) => d.id === docId))`), `shared-doc.tsx`, `search.tsx`, `recent.tsx`, `graph.tsx`/`Backlinks.tsx` — todas fazem list-then-find/filter em memória, nenhuma depende de get-by-id ou filtro no servidor. Rota `/workspace/:docId` e `/shared/:docId` resolvem por `list()` + `.find()`, não por request dedicado.
- 3 caminhos para relações (plano/2-queries/extensão) já registrados em `doc/architecture/01-stack-e-modelagem.md` §2 e §5.3.

### File List

- (nenhum arquivo novo — auditoria e contrato verificados contra `knowledge/src/lib/data/client.ts` e `doc/architecture/01-stack-e-modelagem.md`, ambos entregues nas Stories 1.1/1.3)
