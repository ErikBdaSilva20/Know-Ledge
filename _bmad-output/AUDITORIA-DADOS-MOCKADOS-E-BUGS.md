# Auditoria — dados mockados e bugs de leitura em modo gateway

Data: 2026-07-21. Escopo: `knowledge/src` (frontend) + `knowledge/dev/mock-gateway` (backend local).

Contexto: mais cedo nesta sessão, o Explorer parecia "não criar pastas/documentos" — na
verdade ele criava (confirmado no log do gateway, `201`), só não sabia mostrar, porque lia de
`useDb`/`mockDb` (store mock local) em vez de buscar do gateway real. Corrigi isso especificamente
no Explorer. Esta auditoria varreu o resto do app atrás do mesmo padrão — e achou que ele está
espalhado por quase toda tela de leitura, mais um achado novo e mais grave: **o Editor não
consegue abrir nenhum documento em modo gateway**, o que quebra o fluxo inteiro de edição mesmo
depois do fix do Explorer.

## TL;DR — o que quebra de verdade em modo gateway

| # | Onde | Quebra o quê | Severidade |
|---|------|--------------|------------|
| 1 | `src/components/Editor.tsx:50-51` | Abrir **qualquer** documento (pessoal ou compartilhado) mostra "Documento não encontrado" | 🔴 Crítico — bloqueia todo o fluxo de edição |
| 2 | `src/lib/syncRefs.ts` (usado por `Editor.tsx:88`, `workspace-doc.tsx:92`) | Links `[[wiki]]`, backlinks e arestas de referência no Grafo nunca são gravados/lidos no gateway — só existe no mock | 🔴 Crítico — feature inteira inerte |
| 3 | `src/routes/dashboard.tsx` | Contador de documentos, "Recentes" e "Favoritos" sempre vazios/errados | 🟠 Alto — primeira tela que o usuário vê |
| 4 | `src/routes/admin.tsx` | Métricas (docs/pastas/publicados/usuários), lista de documentos, Base Compartilhada e aba Usuários sempre vazias/erradas | 🟠 Alto |
| 5 | `src/routes/favorites.tsx`, `src/routes/recent.tsx`, `src/routes/search.tsx` | Sempre vazias em modo gateway | 🟠 Alto |
| 6 | `src/routes/shared.tsx`, `src/routes/shared-doc.tsx`, `src/routes/workspace-doc.tsx` | Lista de docs compartilhados, nome do dono/publicador, favorito-toggle — tudo lido do mock | 🟠 Alto |
| 7 | `src/components/Graph.tsx`, `src/components/Backlinks.tsx` | Grafo e painel "Referenciado por" sempre vazios | 🟡 Médio (features secundárias) |
| 8 | `src/components/Explorer.tsx` | **Já corrigido nesta sessão** — lista pastas/documentos direto do gateway | ✅ Resolvido |

Causa raiz é a mesma em todos os itens 1–7: o componente lê `useDb((s) => ...)`, que é
`src/lib/mockDb.ts` (armazenamento local, `localStorage["kv:db:v1"]`), e isso nunca é
repopulado a partir do gateway. As escritas (create/update/remove) já vão para o Postgres
corretamente — só a leitura de volta para a tela é que está errada.

---

## Achado crítico #1 — Editor não abre documentos em modo gateway

`src/components/Editor.tsx:50-51`:
```ts
const personal = useDb((s) => s.documents.find((d) => d.id === id));
const shared = useDb((s) => s.shared_documents.find((s) => s.id === id));
```

`Editor` é usado tanto por `WorkspaceDoc` (`src/routes/workspace-doc.tsx:20`) quanto por
`SharedDoc` (`src/routes/shared-doc.tsx:17`), ambos também lendo o doc raiz via `useDb`. Como
`mockDb`'s `documents`/`shared_documents` estão vazios em modo gateway (o seed foi
intencionalmente esvaziado — ver seção "dados mockados" abaixo), `doc` é sempre `undefined`,
e a tela cai no branch `if (!doc) return <div>Documento não encontrado.</div>` — **mesmo para um
documento que acabou de ser criado com sucesso no Postgres**.

Isso significa: mesmo com o Explorer corrigido (mostrando o documento certinho na árvore), clicar
nele pra abrir cai direto em "não encontrado". O fluxo de criar → abrir → editar → salvar nunca
funcionou de ponta a ponta em modo gateway.

**Correção recomendada**: aplicar o mesmo padrão do Explorer — buscar o documento específico via
`documentsRepo.list()`/`sharedDocumentsRepo.list()` (ou um `.get(id)` novo nos repos, mais barato
que listar tudo) quando `isGatewayMode()`, com um `useEffect` on-mount por `id`.

---

## Achado crítico #2 — sincronização de referências (`[[wiki-links]]`) é 100% mock-only

`src/lib/syncRefs.ts:1,8,32` — `syncPersonalRefs`/`syncSharedRefs` chamam `getState()`/`mutate()`
de `mockDb.ts` diretamente, **sem nenhum branch de `isGatewayMode()`**. Diferente dos repos
(`documentReferencesRepo`, `sharedDocumentReferencesRepo`), que têm o branch certo mas **nunca
são chamados por lugar nenhum do app** — só `syncRefs.ts` popula essas tabelas, e ele só sabe
falar com o mock.

Efeito prático: toda vez que `Editor.tsx:88` chama `syncAllRefsFor(scope, doc.id)` depois de
salvar (ou `workspace-doc.tsx:92` chama `syncSharedRefs` ao publicar), a função tenta achar o
documento em `mockDb` (vazio), cai no `if (!doc) return;` e não faz nada — silenciosamente. As
tabelas `document_references`/`shared_document_references` no Postgres real **nunca são escritas
por nenhum caminho do código atual**, mesmo que o schema/rotas do gateway para elas estejam
corretas (`schemas.ts:55-66`, `tables.ts:18-22`).

Consequência em cascata: `Backlinks.tsx` (painel "Referenciado por") e as arestas tipo `"ref"` do
`Graph.tsx` dependem dessas tabelas — ficam permanentemente vazias em modo gateway, com ou sem os
outros fixes.

**Correção recomendada**: reescrever `syncPersonalRefs`/`syncSharedRefs` para, em modo gateway,
buscar o documento via repo (`documentsRepo`/`sharedDocumentsRepo`), montar a lista de "own docs"
via `documentsRepo.list()` filtrado por owner, e chamar `documentReferencesRepo.create/remove`
(ou um endpoint de "replace all refs" — hoje o mock faz filter+push, que não mapeia 1:1 pra
create/remove individuais do gateway sem uma rota de "sync em lote").

---

## Achado #3 — telas de listagem lendo do mock (padrão idêntico ao Explorer, antes do fix)

Todas usam `useDb((s) => s.<campo>)` sem nenhum branch de `isGatewayMode()`:

| Arquivo | Linhas | Campos lidos do mock |
|---|---|---|
| `src/routes/dashboard.tsx` | 15-17 | `documents`, `shared_documents`, `favorites` |
| `src/routes/admin.tsx` | 19-22 | `documents`, `folders`, `shared_documents`, `users` |
| `src/routes/favorites.tsx` | 12-14 | `favorites`, `documents`, `shared_documents` |
| `src/routes/recent.tsx` | 9-10 | `documents`, `shared_documents` |
| `src/routes/search.tsx` | 10-12 | `documents`, `shared_documents`, `folders` |
| `src/routes/shared.tsx` | 14-15 | `shared_documents`, `users` |
| `src/routes/shared-doc.tsx` | 17-26 | `shared_documents`, `users`, `documents`, `favorites` |
| `src/routes/workspace-doc.tsx` | 20-26 | `documents`, `users`, `favorites` |
| `src/components/Graph.tsx` | 34-38 | `documents`, `folders`, `shared_documents`, `document_references`, `shared_document_references` |
| `src/components/Backlinks.tsx` | 15 | tudo (via `computeBacklinks`) |

Em modo gateway, todas mostram listas vazias (ou dados desatualizados/mockados) mesmo com o
Postgres cheio de dados reais. Nenhuma delas dá erro visível — é um "vazio silencioso", o mesmo
tipo de bug que pareceu "botão não funciona" no Explorer.

**Correção recomendada**: mesmo padrão do Explorer — cada tela busca via repo (`.list()`) quando
`isGatewayMode()`, refaz o fetch depois de qualquer mutação que ela mesma faça. Dá pra reduzir
duplicação com um hook pequeno tipo `useGatewayList(fetchFn)` (fetch on-mount + `refresh()`
exposto), mas isso é uma escolha de arquitetura pra decidir, não fiz sozinho.

---

## Dados mockados que ainda existem (intencionais, não são bug)

Estes já foram discutidos e mantidos de propósito nesta sessão — listando aqui só pra fechar o
quadro completo, não como "erro a corrigir":

- **`src/lib/mockDb.ts:39-44`** — 4 usuários fixos (Ana/Bruno/Carla/Diego, cobrindo rep/manager/
  admin). Pastas/documentos/shared docs ficam vazios de propósito (`seed()`). Serve pro modo mock
  (`npm run dev:mock`) e pra resolver nome de dono/publicador nas telas que ainda leem `users` do
  mock (ver achado #3 — `users` é o único campo do mock sem alternativa real, porque não existe
  endpoint de listagem de usuários no gateway ainda — decisão já tomada antes: mostrar id/"—" no
  lugar quando isso for endereçado).
- **`src/routes/login.tsx` (`MockLoginButton`)** — login mock de um clique, sem escolha de perfil,
  resolve pro usuário fixo `u_carla` (admin) via `session.tsx:29`. Intencional.
- **`src/lib/data/users.repo.ts`** — código morto, nunca importado em lugar nenhum. Só mock,
  sem branch de gateway (comentário já avisa isso). Não quebra nada por não ser chamado, mas é
  lixo que pode ser removido quando quiserem.
- **`src/lib/useDb.ts`** — o hook em si é só uma ponte pro `mockDb`, sem lógica própria a
  corrigir; o problema está em quem o chama sem checar o modo (achados #1-3 acima).

## Backend (mock-gateway) — nenhum bug encontrado

Revisei `dev/mock-gateway/src/routes/data.ts` (rotas genéricas `/data/:table`) e
`dev/mock-gateway/src/schemas.ts` (whitelist de campos por tabela). RBAC, ownership,
optimistic concurrency (409) e validação de referência (`assertOwnedFolder`,
`assertReferenceTarget`, `assertFavoriteTarget`) parecem corretos e consistentes com o schema do
Postgres. O backend faz a parte dele certinho — todo o problema listado acima é do frontend não
ir buscar o que o backend já tem certo.

---

## O que já foi corrigido nesta sessão (referência)

- `src/components/Explorer.tsx` — busca pastas/documentos via `foldersRepo.list()`/
  `documentsRepo.list()` em modo gateway, refaz o fetch depois de toda mutação local
  (criar, renomear, apagar, arrastar). Ainda sofre do achado #1 (abrir o documento quebra no
  Editor) e do achado #2 (grupo por dono/nome de usuário ainda usa mock — aceitável, é a mesma
  lacuna de "sem endpoint de usuários" já conhecida).

## Sugestão de ordem pra atacar (se decidirem corrigir)

1. Achado #1 (Editor) — é o bloqueador real, sem ele nada do resto importa.
2. Achado #2 (syncRefs) — trabalhoso (não é 1:1 com create/remove do gateway), mas fecha o
   Backlinks/Grafo.
3. Achado #3 — mecânico, repetir o padrão do Explorer em cada arquivo listado. Bom candidato pra
   extrair um hook compartilhado dado o número de repetições (10 arquivos).

Nenhuma dessas correções foi aplicada agora — só o Explorer, que já estava em andamento antes
desta auditoria começar. O resto fica documentado aqui pra vocês decidirem prioridade.
