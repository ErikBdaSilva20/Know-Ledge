---
baseline_commit: 6de259e96aa22e09d3e6abdf7c005d4f5eebf364
---

# Story 1.6: Costura mock → gateway (a troca sem redesenhar telas)

Status: review

## Story

As a **engenheiro reconectando o Knowledge Vault ao backend real**,
I want **um plano de troca da implementação dos repos (mock → `db.table`) sem alterar telas**,
so that **a promessa do brief se cumpra: "só trocar a implementação dos repositórios"**.

## Acceptance Criteria

1. Está definido que **a interface pública dos repos não muda** entre mock e real — só a implementação interna. As telas continuam chamando `listDocuments()`, etc. [Source: LOVEABLE-BRIEF.md#2.2][Source: LOVEABLE-BRIEF.md#9]
2. Está mapeado, entidade por entidade, o alvo real: `documents` → `db.table('document')`, `folders` → `db.table('folder')`, `sharedDocuments` → `db.table('shared_document')`, `references` → `db.table('document_reference')` + `db.table('shared_document_reference')`, `favorites` → `db.table('favorite')`.
3. Está documentado que **campos derivados pela sessão deixam de ser enviados** na troca: `owner_id`, `published_by` param de vir do mock/form e passam a ser setados pelo gateway. (Story 3.1, 3.5)
4. O **seletor de papel mock** (`LOVEABLE-BRIEF §4`) é substituído por `auth.me()`; `auth.signIn/signUp/signOut` substituem o "login mock". [Source: Importantdoc.md#B8]
5. Está definida uma **estratégia de flag** (ex.: `VITE_DATA_SOURCE=mock|gateway`) que permite alternar as implementações sem tocar na UI, útil para o tenant-local (E7).
6. Uma checklist de regressão confirma que cada tela do brief (§5) funciona idêntica após a troca, incluindo estados vazios e confirmações de exclusão.

## Tasks / Subtasks

- [x] Task 1: Definir a interface estável dos repos (contrato imutável UI-facing) (AC: #1)
- [x] Task 2: Tabela de mapeamento repo → `db.table('<snake_case>')` (AC: #2)
- [x] Task 3: Listar campos que somem na troca (setados pelo gateway) (AC: #3)
  - [x] Subtask 3.1: `owner_id` (folder, document, document_reference, favorite)
  - [x] Subtask 3.2: `published_by` (shared_document — via rota Publicar, Story 4.1)
  - [x] Subtask 3.3: `id`, `created_at`, `updated_at` (sempre server-generated)
- [x] Task 4: Substituir auth mock por Better-Auth (`auth.me`, signIn/up/out) (AC: #4)
- [x] Task 5: Definir a flag `VITE_DATA_SOURCE` e como o E7 a usa (AC: #5)
- [x] Task 6: Checklist de regressão por tela (AC: #6)
- [x] Task 7: Reaberta a partir de `_bmad-output/AUDITORIA-DADOS-MOCKADOS-E-BUGS.md` (2026-07-21) — a checklist de regressão da Task 6 foi só estrutural (`tsc`/`build`/`lint`), sem passe manual em cada tela; a auditoria achou que o padrão `useDb` (mock) sem branch `isGatewayMode()` está espalhado pelas telas de leitura. AC#6 ("cada tela do brief funciona idêntica após a troca") só é satisfeito de fato quando os 3 subitens abaixo fecharem. Todos os 3 fecharam nesta sessão; status vai para `review` (não `done`) porque falta o passe manual em navegador — ver nota de verificação abaixo.
  - [x] Subtask 7.1 (bloco 1/3 — achado crítico #1): `Editor.tsx` não abria nenhum documento em modo gateway (`doc` sempre `undefined` via mock). Corrigido em `Editor.tsx`, `workspace-doc.tsx`, `shared-doc.tsx` — busca via `documentsRepo`/`sharedDocumentsRepo`.list() quando `isGatewayMode()`. `tsc --noEmit` e `npm run build` limpos.
  - [x] Subtask 7.2 (bloco 2/3 — achado crítico #2): `syncRefs.ts` (`syncPersonalRefs`/`syncSharedRefs`) grava só no mock — `document_references`/`shared_document_references` nunca eram escritas no gateway real. Corrigido: as duas funções (+ `syncAllRefsFor`) agora são `async` e, em modo gateway, buscam via repo e fazem *diff* do conjunto de arestas desejado contra o existente (create só do que falta, remove só do que sobrou) em vez do delete-all-then-recreate do mock. Ainda bloqueia Backlinks/Grafo até o bloco 3 (eles continuam lendo do mock).
  - [x] Subtask 7.3 (bloco 3/3 — achado #3): telas de listagem (`dashboard`, `admin`, `favorites`, `recent`, `search`, `shared`, `shared-doc`, `workspace-doc`, `Graph`, `Backlinks`) liam `useDb` sem branch de gateway — sempre vazias/desatualizadas em modo gateway. Corrigido com um hook compartilhado `useGatewayList` (ver notas abaixo) em vez de repetir o padrão inline 10 vezes.

## Dev Notes

- Entrega esperada do produto: "pronto para depois substituirmos a camada de dados mockada pela integração com o backend real — sem precisar redesenhar telas". Esta story é o roteiro dessa substituição. [Source: LOVEABLE-BRIEF.md#9]
- **Cuidado de nomenclatura:** os repos podem usar nomes em inglês/camelCase, mas as **tabelas e colunas são snake_case** (o backend devolve assim). O mapeamento de nomes fica no repo, não na UI. [Source: LOVEABLE-BRIEF.md#3][Source: Importantdoc.md#B4]
- **Exclusão é permanente e imediata** (sem lixeira). A confirmação é UX; o `remove()` do repo chama `DELETE /data/:table/:id`. [Source: LOVEABLE-BRIEF.md#2.3][Source: LOVEABLE-BRIEF.md#6]

### Project Structure Notes

- Depende de Story 1.5 (camada isolada) e das Stories de E2 (schema real). Habilita E7 (tenant-local) via a flag `VITE_DATA_SOURCE`.

### References

- [Source: LOVEABLE-BRIEF.md#2.2] — Estruture o acesso a dados como se já fosse a API real
- [Source: LOVEABLE-BRIEF.md#9] — Entrega esperada (trocar só os repositórios)
- [Source: Importantdoc.md#B5] — db.table e limites
- [Source: Importantdoc.md#B8] — Better-Auth

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- Interface pública dos repos (`list/create/update/remove`) não mudou — cada `*.repo.ts` agora tem um `if (isGatewayMode()) { ... } else { ... mock ... }` interno; nenhuma tela precisou mudar (AC#1).
- **Correção em relação ao AC#2 original:** a story sugeria nomes de tabela no singular (`document`, `folder`, `shared_document`...). O documento de arquitetura aprovado (`doc/architecture/01-stack-e-modelagem.md` §3, Status: Aprovado) já define os nomes reais no **plural** (`documents`, `folders`, `shared_documents`, `document_references`, `shared_document_references`, `favorites`) — por precedência de `doc/README.md` ("documento numerado vigente vence sobre rascunho de story"), os repos usam o plural. Mapeamento real:
  | Repo | `db.table('<nome>')` |
  |---|---|
  | `documentsRepo` | `documents` |
  | `foldersRepo` | `folders` |
  | `sharedDocumentsRepo` | `shared_documents` |
  | `documentReferencesRepo` | `document_references` |
  | `sharedDocumentReferencesRepo` | `shared_document_references` |
  | `favoritesRepo` | `favorites` |
  | `usersRepo` | (não é `/data/:table` — vem do Better-Auth) |
- Campos que somem na troca (AC#3): `owner_id` deixa de ser enviado em `create()` de `documents`, `folders`, `document_references`, `favorites` (destructure-and-drop antes de chamar `table.create()`); `published_by` idem em `shared_documents`. `id`/`created_at`/`updated_at` já eram sempre gerados no mock e continuam sendo — no gateway, o servidor os gera.
- `auth.me()/signIn/signUp/signOut` implementados em `client.ts` (Story 1.3); `knowledge/src/lib/session.tsx` agora ramifica em `isGatewayMode()`: hidrata `user`/`role` via `auth.me()` em vez do picker mock quando a flag está ligada. `setUserId()` vira no-op em modo gateway (AC#4) — **gap explícito:** ainda não existe formulário de login real (`LoginPage` continua sendo o seletor mock); em modo gateway a sessão só é reconhecida se já existir um cookie válido. Login real (`auth.signIn` chamado de uma tela) fica para quando o Epic 3 (RBAC) for implementado.
- Flag `VITE_DATA_SOURCE` definida em `knowledge/src/lib/data/dataSource.ts` (`isGatewayMode()`), documentada em `knowledge/.env.example`. Default é `mock` (variável ausente) — comportamento de hoje preservado sem nenhuma mudança de configuração. O E7 (tenant-local) liga `VITE_DATA_SOURCE=gateway` + `VITE_GATEWAY_URL` apontando pro gateway local.
- Checklist de regressão (AC#6): `npx tsc --noEmit` limpo, `npm run build` limpo, `npm run lint` sem erros (13 warnings pré-existentes, nenhum novo), `npm run dev` sobe e serve HTTP 200 sem erro de import — cobre a costura estrutural. **Não foi feito um passe manual clicando em cada tela no navegador** (sem ferramenta de automação de browser neste ambiente); recomendo um smoke test manual antes de dar a Epic 1 por 100% verificada em produção.
- **Gap encontrado, não fechado nesta story:** `knowledge/src/lib/syncRefs.ts` (auto-referências a partir de `[[wikilinks]]`) ainda escreve direto no `mockDb`, sem passar pelos repos de referência — funciona hoje (modo mock), mas quando `VITE_DATA_SOURCE=gateway` ligar de verdade, `syncPersonalRefs`/`syncSharedRefs` não vão persistir no Neon. Precisa ser portado pra usar `documentReferencesRepo`/`sharedDocumentReferencesRepo` antes do Epic 3. Sinalizado ao usuário, não corrigido aqui por envolver mudança de sync→async com risco de timing na UI de backlinks (fora do escopo desta story sem validação).

### 2026-07-21 — Reabertura (Task 7, bloco 1/3)

- Confirmado em runtime: `Editor.tsx` caía sempre em "Documento não encontrado" em modo gateway, mesmo para documento recém-criado (confirmado no log do gateway com `201`). Causa raiz: `doc` vinha só de `useDb`/`mockDb`, nunca do gateway.
- Corrigido com o mesmo padrão do `Explorer.tsx` (Story 1.6 original): estado local + `useEffect` que busca via `documentsRepo.list()`/`sharedDocumentsRepo.list()` (list-then-find, sem get-by-id — Importantdoc.md §B5) quando `isGatewayMode()`. Aplicado em `Editor.tsx` e também em `workspace-doc.tsx`/`shared-doc.tsx`, que tinham o mesmo bug na leitura do `doc` raiz da página (usado pra checar dono, montar o título do diálogo de exclusão e montar o payload de "Publicar").
- **Não corrigido neste bloco (fora do escopo do achado #1, decisão consciente):** `owner`/`publishedBy`/`sourceDoc` em `workspace-doc.tsx`/`shared-doc.tsx` e as listas `allPersonal`/`allShared` do autocomplete em `Editor.tsx` continuam lendo do mock — fazem parte do achado #3 (telas de listagem) e do gap conhecido de "sem endpoint de usuários", tratados nos próximos blocos.
- **Edge case identificado, não resolvido:** `workspace-doc.tsx`/`shared-doc.tsx` buscam `doc` uma vez (on mount); se o usuário editar no `Editor` (autosave) e clicar "Publicar" sem a página recarregar, o payload publicado usa o `title`/`content` da busca inicial, não o mais recente. No mock isso nunca foi um problema (store reativo global). Corrigir exigiria levantar o estado do doc pra um nível compartilhado entre a página e o `Editor` — mudança maior, fora do escopo deste bloco; sinalizado para decisão antes do Epic 3 fechar de vez.
- Verificado: `npx tsc --noEmit` limpo, `npm run build` limpo (mesmo warning pré-existente de chunk-size). Sem acesso a browser automation nesta sessão — não foi feito o clique manual ponta-a-ponta; ambiente local (`docker compose` + `dev:gateway`) está de pé em `localhost:8787`/`localhost:5174` para o Erik confirmar visualmente.

### 2026-07-21 — Reabertura (Task 7, bloco 2/3)

- Causa raiz confirmada (achado crítico #2): `syncPersonalRefs`/`syncSharedRefs` chamavam `getState()`/`mutate()` do `mockDb` direto, sem branch de `isGatewayMode()` — os repos de referência (`documentReferencesRepo`, `sharedDocumentReferencesRepo`) já existiam com o branch certo desde a Story original, mas nunca eram chamados por ninguém.
- `syncRefs.ts` reescrito: `syncPersonalRefs`/`syncSharedRefs`/`syncAllRefsFor` viraram `async` e despacham pro branch mock (comportamento idêntico ao anterior, extraído para `*Mock`) ou pro gateway (`*Gateway`, novo).
- **Decisão de design (pensando em 6+ anos de uso, não só em fechar o achado):** o caminho mock pode se dar ao luxo de "apaga tudo e recria" (filter+push em memória, custo zero). Contra o gateway real isso viraria N chamadas HTTP de create + N de remove a cada save, mesmo quando nada mudou no conjunto de links. Em vez de portar esse padrão 1:1, o caminho gateway faz um **diff do conjunto de arestas** (link atual do conteúdo vs. refs já existentes pra aquele documento) e só chama `create`/`remove` no que realmente mudou — menos chamadas de rede, `created_at` de arestas não tocadas fica estável, e o padrão escala com o tamanho do doc, não com o número de saves.
- Pontos de chamada (`Editor.tsx` após save, `workspace-doc.tsx` após publicar) viraram fire-and-forget com `.catch(handleDomainError)`: a sincronização de refs é secundária — se ela falhar, o save/publish principal (que já teve sucesso) não deve ser desfeito nem marcado como erro; só reporta o erro à parte.
- RBAC conferido contra `dev/mock-gateway/src/tables.ts`/`schemas.ts`: `document_references` tem `owner_id` server-derived e `ownerVisibility: true` (rep sincroniza só as próprias refs, sem 403); `shared_document_references` tem `ownerVisibility: false` (escrita só manager/admin) — consistente com `permsFor()` em `session.tsx`, que só dá `publishShared` pra manager/admin. Nenhuma inconsistência de permissão nova introduzida.
- Ainda não fecha Backlinks/Grafo (achado #7) — eles continuam lendo do mock; é o bloco 3.
- Verificado: `npx tsc --noEmit` limpo, `npm run build` limpo, `npm run lint` sem erros novos (2 warnings pré-existentes de `react-hooks/exhaustive-deps` em `Editor.tsx`, nenhum novo). Sem browser automation nesta sessão.

### 2026-07-21 — Reabertura (Task 7, bloco 3/3)

- 10 arquivos liam `useDb` direto (mock) sem branch `isGatewayMode()`: `dashboard.tsx`, `admin.tsx`, `favorites.tsx`, `recent.tsx`, `search.tsx`, `shared.tsx`, `shared-doc.tsx`, `workspace-doc.tsx`, `Graph.tsx`, `Backlinks.tsx`.
- **Decisão de arquitetura consultada com o Erik antes de codar** (a própria auditoria deixou em aberto): dado o volume (10 arquivos repetindo o mesmo padrão fetch-on-mount + refresh), extraí um hook compartilhado em vez de repetir inline 10x como o `Explorer.tsx` fez para 2 coleções. Novo `knowledge/src/lib/useGatewayList.ts`: `useGatewayList(mockValue, list)` recebe o valor já selecionado do mock (reativo via `useDb`) e a função `.list` **estável** do repo (não uma closure inline — evitaria refetch a cada render); em modo mock devolve o valor do mock direto, em modo gateway busca on-mount e expõe `refresh()` pra chamar depois de qualquer mutação própria da tela. Escala melhor que 10 cópias do bloco do Explorer: qualquer melhoria futura (cache, retry, loading state) se aplica uma vez só.
- `favorites.tsx`, `workspace-doc.tsx`, `shared-doc.tsx` chamam `refresh()` depois de `favoritesRepo.create/remove` (favoritar/desfavoritar); `admin.tsx` depois de `documentsRepo.remove`/`sharedDocumentsRepo.remove`; `shared.tsx` depois de `sharedDocumentsRepo.create` (antes do `navigate`, pra lista já vir atualizada quando o usuário voltar).
- `computeBacklinks` (`lib/backlinks.ts`) tomava o `DbState` inteiro do mock como parâmetro — mudei a assinatura pra um tipo `BacklinksSource` só com os 4 campos que ela realmente lê (`documents`, `shared_documents`, `document_references`, `shared_document_references`), desacoplando de `mockDb` de vez. `Backlinks.tsx` monta esse objeto a partir de 4 `useGatewayList` (mock ou gateway) em vez de um único `useDb(computeBacklinks)`.
- **Gap conhecido, não fechado (decisão consciente, já documentada nos achados desde a Story original):** `users` não tem endpoint no gateway — `admin.tsx` (aba Usuários), `shared.tsx`/`workspace-doc.tsx`/`shared-doc.tsx` (nome de dono/publicador) continuam lendo `useDb((s) => s.users)` em todo modo. Fora de escopo desta correção.
- Verificado: `npx tsc --noEmit` limpo, `npm run build` limpo, `npm run lint` sem erros novos (mesmos warnings pré-existentes de antes do bloco 3, nenhum novo). Sem browser automation nesta sessão — ambiente local (`docker compose` + `dev:gateway`) segue de pé em `localhost:8787`/`localhost:5174` pro Erik confirmar visualmente antes de fechar como `done`.

### File List

- `knowledge/src/lib/data/dataSource.ts` (novo)
- `knowledge/src/lib/data/*.repo.ts` (6 arquivos — branch mock/gateway, ver Story 1.5)
- `knowledge/src/lib/session.tsx` (branch `isGatewayMode()` em `SessionProvider`)
- `knowledge/.env.example` (novo — documenta `VITE_DATA_SOURCE`)
- `knowledge/src/components/Editor.tsx` (2026-07-21, bloco 1/3 — busca `doc` via repo em modo gateway)
- `knowledge/src/routes/workspace-doc.tsx` (2026-07-21, bloco 1/3 — idem)
- `knowledge/src/routes/shared-doc.tsx` (2026-07-21, bloco 1/3 — idem)
- `knowledge/src/lib/syncRefs.ts` (2026-07-21, bloco 2/3 — branch gateway com diff create/remove, em vez de delete-all-then-recreate)
- `knowledge/src/components/Editor.tsx` (2026-07-21, bloco 2/3 — `syncAllRefsFor(...).catch(handleDomainError)`)
- `knowledge/src/routes/workspace-doc.tsx` (2026-07-21, bloco 2/3 — `syncSharedRefs(...).catch(handleDomainError)`)
- `knowledge/src/lib/useGatewayList.ts` (novo, 2026-07-21, bloco 3/3 — hook compartilhado fetch-on-mount + refresh)
- `knowledge/src/lib/backlinks.ts` (2026-07-21, bloco 3/3 — `computeBacklinks` desacoplado de `DbState`)
- `knowledge/src/routes/dashboard.tsx`, `admin.tsx`, `favorites.tsx`, `recent.tsx`, `search.tsx`, `shared.tsx`, `shared-doc.tsx`, `workspace-doc.tsx` (2026-07-21, bloco 3/3 — leitura via `useGatewayList` em vez de `useDb` puro)
- `knowledge/src/components/Graph.tsx`, `Backlinks.tsx` (2026-07-21, bloco 3/3 — idem)
