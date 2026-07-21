# Blocos p/ próxima sessão — Explorer, Grafo e tela de Ajuda

Data: 2026-07-21. Origem: pedidos do Erik no fim de uma sessão (vai continuar em outra).
Formato: **blocos independentes**, cada um executável do zero, com arquivos/linhas âncora,
comportamento atual, o que fazer, decisões em aberto e critérios de aceite.

> Ordem sugerida de ataque: **1 → 2 → 3 → 4** (1 é o mais isolado; 2 e 3 são no mesmo arquivo
> `Graph.tsx`, fazer em sequência; 4 é o maior, mas independente dos outros).
>
> Estado do código quando isto foi escrito: há trabalho **não commitado** (fixes do Explorer
> — arrastar arquivos + "novo doc na pasta clicada" — e toda a formatação Markdown + syntax
> highlighting). Commitar isso antes de começar os blocos abaixo, pra manter os diffs limpos.

---

## Bloco 1 — Explorer: impedir documentos com nome duplicado

**Objetivo:** não permitir salvar dois documentos com o mesmo nome (título).

**Onde:** `knowledge/src/components/Explorer.tsx`
- `createDoc` (`:127`) — cria com `title: "Sem título"`.
- `commitRename` (`:172-205`) — grava o novo título via `documentsRepo.update(id, { title: v })`
  (`:196`), **sem nenhuma checagem de unicidade**.

**Comportamento atual:** dois docs podem ter o mesmo título (inclusive vários "Sem título").
Nada valida. O sistema de `[[wiki-links]]` resolve por **id** (ADR-001), então links não quebram —
isto é uma questão de **UX/clareza**, não de integridade de link.

**O que fazer:**
1. No `commitRename` (e no rename inline de documento), antes de `documentsRepo.update`, checar se
   já existe outro documento com o mesmo título **no mesmo escopo** (ver decisão abaixo). Se existir,
   bloquear com um `toast.error` claro ("Já existe um documento com esse nome nesta pasta") e manter
   o modo de edição aberto (não fechar o `renaming`).
2. No `createDoc`, se "Sem título" já existir no destino, criar como "Sem título 2", "Sem título 3"…
   (auto-incremento) — ou entrar direto em rename forçando um nome único. Decidir com o Erik.
3. Comparação **case-insensitive** e com `trim()` (bater com o `resolveWikiLink`, que já compara
   `toLowerCase()`).

**Decisões em aberto (confirmar com o Erik antes de codar):**
- **Escopo da unicidade:** por **pasta** (dois docs de mesmo nome em pastas diferentes é ok) ou
  **global por usuário** (nunca dois nomes iguais no vault todo)? Recomendo **por pasta** — é o
  mental model de sistema de arquivos e menos restritivo.
- **Servidor também?** Hoje o gateway não tem `unique(owner_id, folder_id, lower(title))`. A checagem
  no front resolve o caso normal, mas duas abas/edições concorrentes furam. Fechar de verdade exige
  um índice único no schema (`supabase/migrations/0001_business_schema.sql`) + tratar o `23505`
  (`translatePgError` já mapeia unique_violation → 409) com uma mensagem específica. Recomendo: front
  agora, índice único como item de segurança depois (marcar como follow-up).
- Vale a mesma regra pra **pastas** (nome de pasta duplicado na mesma pasta-pai)? O pedido foi só
  "arquivos", mas provavelmente faz sentido estender. Confirmar.

**Critérios de aceite:**
- [ ] Tentar renomear/criar um doc com nome já existente no escopo escolhido → bloqueado com toast, edição continua aberta.
- [ ] Comparação ignora maiúsculas/minúsculas e espaços nas pontas.
- [ ] `tsc`/`build`/`lint` limpos.

---

## Bloco 2 — Grafo: arrastar nós, trazer pra frente ao clicar, nome no hover

**Objetivo:** deixar o grafo manipulável e legível (hoje os rótulos se sobrepõem e vira bagunça).

**Onde:** `knowledge/src/components/Graph.tsx` (SVG + simulação de força).
- `positions` state (`:146`) guarda as coordenadas de cada nó; a simulação escreve nele
  (`useEffect` `:147-204`, roda ~160 frames no mount / quando `nodes.length`/`edges.length`/`dims` mudam).
- Nós renderizados como `<g transform=translate(x,y)>` com `onClick` que navega (`:261`), `<circle>` e
  `<text>` com o rótulo **sempre visível acima** (`:273`). Não há drag nem hover.
- Em SVG **não existe z-index** — o que está na frente é o que é pintado **por último** (ordem no array).

### 2a. Arrastar (grab) os nós — e levar os conectados junto
- Adicionar handlers de ponteiro no `<g>` do nó: `onPointerDown` (inicia drag, guarda o nó e a posição
  inicial do mouse), `onPointerMove` no SVG (atualiza posição), `onPointerUp` (finaliza). Usar
  Pointer Events (cobre mouse + touch) e `setPointerCapture`.
- Ao arrastar um nó, **mover junto os nós conectados a ele** (vizinhos diretos via `edges`) pelo mesmo
  delta. Montar um índice de adjacência (`Map<nodeKey, nodeKey[]>`) a partir de `edges` uma vez
  (`useMemo`). Decidir se é só o vizinho direto (1 salto) ou a cadeia toda — recomendo **1 salto**
  (mover o nó + vizinhos diretos), senão arrastar um hub move o grafo inteiro.
- **Restringir à área** ("só na área que ela está"): fazer clamp das coordenadas em `[r, dims.w - r]` ×
  `[r, dims.h - r]` pra não sair do SVG.
- **Interação com a simulação:** enquanto arrasta, "fixar" (pin) o nó arrastado (e os que vão junto) —
  a simulação não deve puxá-los de volta. Ou pausar a sim durante o drag. Guardar um set de nós
  "pinned"; a sim pula a integração deles.
- Separar **clique** de **drag**: só navegar (`navigate`) se o ponteiro não moveu além de um threshold
  (ex. 4px) entre down e up. Hoje o `onClick` navega direto — vai conflitar com o drag.

### 2b. Trazer pra frente ao clicar (resolver rótulos sobrepostos)
- Manter um `Set<nodeKey>` de nós "levantados". Ao clicar (ou ao dar hover — ver 2c), adicionar o nó
  ao set. Renderizar os nós levantados **num segundo passe, depois** dos demais (no fim do array de
  `<g>`), pra ficarem por cima (paint order = z-index em SVG). O rótulo do nó levantado ganha também
  um fundo sólido (retângulo atrás do `<text>`) pra ficar legível sobre os outros.

### 2c. (Alternativa/complemento) Nome só no hover
- Opção discutida pelo Erik: em vez de mostrar todos os rótulos sempre, mostrar o nome **no hover**
  do pontinho (`onPointerEnter`/`onPointerLeave` → estado `hoveredKey`). Reduz a poluição visual na
  origem. Pode conviver com 2b (hover levanta + mostra; clique fixa levantado).
- **Recomendação:** implementar **2b + 2c juntos** — rótulos com opacidade reduzida por padrão,
  full no hover, e clique "fixa" o nó levantado com rótulo sólido. Confirmar o gosto do Erik.

**Decisões em aberto:**
- Vizinhos: 1 salto (recomendado) vs cadeia inteira.
- Rótulos: sempre visíveis (com raise no hover/clique) vs ocultos por padrão (só no hover). Recomendo
  o híbrido acima.
- Persistir posições arrastadas? (hoje a sim recalcula tudo ao reabrir). Provavelmente **não** nesta
  fase — reposicionar é efêmero. Marcar como possível follow-up.

**Critérios de aceite:**
- [ ] Arrastar um pontinho move ele + vizinhos diretos, sem sair da área do grafo.
- [ ] Clicar sem arrastar ainda navega pro documento; arrastar não navega.
- [ ] Nó clicado/em hover fica por cima dos outros com rótulo legível (sem sobreposição feia).
- [ ] Sim de força não "briga" com o nó sendo arrastado.
- [ ] `tsc`/`build`/`lint` limpos.

---

## Bloco 3 — Grafo: destacar as linhas de referência

**Objetivo:** deixar visualmente claro quando um arquivo **faz referência** a outro, distinto das
linhas de "está dentro de" (containment).

**Onde:** `knowledge/src/components/Graph.tsx:217-248` (render das arestas).

**Comportamento atual (importante):** as arestas já têm dois tipos:
- `contain` (pasta → subpasta/documento): linha **pontilhada** (`strokeDasharray="3 3"`, `:248`).
- `ref` (documento → documento referenciado): linha **sólida** (sem dash) já hoje (`:247-248`).

Ou seja, **linha de referência sólida já existe**. O motivo provável de o Erik não a ver: o
`syncRefs` não gravava as referências em modo gateway (bug corrigido nesta leva) — sem refs no banco,
não há aresta `ref` pra desenhar. **Primeiro passo do bloco: verificar** se, com o fix do syncRefs +
os dados reais, as arestas `ref` aparecem. Se aparecerem, o "criar linha" já está feito — o bloco vira
**realce**.

**O que fazer (realce, se as refs já desenham):**
1. Dar cor própria à aresta `ref` (ex. usar `--color-primary` ou uma das `--chart-*`) pra não se
   confundir com o cinza da containment.
2. O pedido do Erik: "uma linha única que fica **do lado** da pontilhada" — quando uma aresta `ref`
   liga o mesmo par que uma `contain` (raro, mas possível), **deslocar** a `ref` com um offset
   perpendicular pequeno pra as duas coexistirem sem sobrepor. O código já calcula um vetor
   perpendicular (`nx`/`ny`, `:227-228`) pra curvar a aresta — reaproveitar pra offset paralelo.
3. Opcional: seta/ponta na aresta `ref` indicando direção (source → target).
4. Legenda no canto do grafo ("— referência · ⋯ contido em") pra o usuário entender.

**Decisões em aberto:**
- Confirmar com o Erik se, após o fix do syncRefs, as refs aparecem (talvez o bloco seja só cor +
  legenda). Rodar em modo gateway com um doc que tenha `[[link]]` pra validar.
- Cor da linha de referência (primary vs uma chart-color).

**Critérios de aceite:**
- [ ] Criar um doc B, referenciar `[[B]]` a partir de A, abrir o grafo → aparece uma aresta sólida A→B, visualmente distinta das pontilhadas de containment.
- [ ] Legenda explica os dois tipos de linha.
- [ ] `tsc`/`build`/`lint` limpos.

---

## Bloco 4 — Nova tela de Ajuda / Documentação (em 3 partes)

**Objetivo:** uma tela dedicada, confortável de ler mas detalhada, ensinando a usar o Knowledge
Vault. Melhora a intuitividade pra quem chega novo.

**Onde (a criar):**
- Novo componente `knowledge/src/routes/help.tsx` (ex. `HelpPage`).
- Rota em `knowledge/src/App.tsx` — adicionar `<Route path="/ajuda" element={<HelpPage />} />` dentro
  do `ShellLayout` (junto com dashboard/workspace/etc., `:110-124`).
- Item de nav em `knowledge/src/components/layout/AppShell.tsx` — adicionar ao array `NAV_ITEMS`
  (`:34-41`): `{ to: "/ajuda", label: "Ajuda", icon: HelpCircle }` (importar `HelpCircle`/`LifeBuoy`
  do lucide-react).

**Aproveitar o que já existe:** a formatação Markdown ficou linda (bloco anterior — `MarkdownView` +
`prose.css` + syntax highlighting). A tela de ajuda pode ser **escrita em Markdown** e renderizada com
o próprio `MarkdownView` — dogfooding do renderer, e o texto fica fácil de manter. (Cuidado: o
`MarkdownView` hoje espera `personalDocs`/`sharedDocs`/`visiblePersonalIds` pra resolver wiki-links;
pra a tela de ajuda dá pra passar arrays vazios, já que a ajuda não referencia documentos do usuário.)

### As 3 partes (conteúdo a escrever):

**Parte 1 — "Como usar o Knowledge Vault" (visão geral + o que cada área faz).**
- O que é o produto (base de conhecimento pessoal + compartilhada, em Markdown).
- Tour das áreas do menu e o que cada uma faz:
  - **Início** (dashboard: recentes + favoritos), **Meu Workspace** (seu vault pessoal: pastas e
    documentos), **Base Compartilhada** (documentos publicados pra todo o time), **Busca**, **Grafo**
    (visão de conexões), **Favoritos**, **Recentes**, **Administração** (só manager/admin).
  - O que são **pastas** vs **documentos**, e que arrastar move itens entre pastas.
- Papéis: **rep** (vê/edita só o próprio), **manager/admin** (veem tudo, publicam na Base
  Compartilhada). (bater com `permsFor()` em `session.tsx`.)

**Parte 2 — "Guia detalhado" (documentação confortável, passo a passo).**
- Criar/renomear/excluir pastas e documentos (inline no Explorer).
- Arrastar pastas e arquivos pra reorganizar.
- Editar em **Markdown**: mostrar a formatação suportada — títulos, listas, listas de tarefas
  `- [ ]`, **negrito**/*itálico*, tabelas, citações, `código inline` e blocos de código **com realce
  de sintaxe** (linguagens suportadas — ver `highlight.ts`). Um exemplo renderizado de cada.
- Salvar (autosave + botão "Salvar").
- Publicar um documento na **Base Compartilhada** (quem pode, o que acontece).

**Parte 3 — "Referências entre arquivos ([[wiki-links]])".**
- Como criar um link: digitar `[[`, escolher o documento no autocomplete (embed do id — sobrevive a
  renomear).
- Onde eles aparecem: no texto renderizado (pill ◆ pessoal / ◇ compartilhado), no painel
  **"Referenciado por"** (backlinks) no topo do documento, e como **arestas no Grafo** (linha sólida —
  ver Bloco 3).
- Boas práticas (nomear bem, evitar links quebrados).

**Decisões em aberto:**
- Rota `/ajuda` vs `/help` (recomendo `/ajuda`, resto da UI é PT).
- Uma página só com as 3 partes em seções (com um índice/sumário no topo) **ou** 3 abas/sub-rotas.
  Recomendo **uma página com âncoras + sumário lateral** — "confortável de ler" pede rolagem contínua,
  não navegação fragmentada.
- Escrever o conteúdo como arquivos `.md` importados (via `?raw` do Vite) vs string no componente.
  Recomendo `.md` em `src/content/ajuda/*.md` importados com `?raw` — separa conteúdo de código.

**Critérios de aceite:**
- [ ] Item "Ajuda" no menu, rota `/ajuda` funciona (logado).
- [ ] As 3 partes presentes, com sumário/navegação interna.
- [ ] Conteúdo renderizado com o `MarkdownView` (formatação bonita reaproveitada).
- [ ] Legível em claro e escuro; responsivo.
- [ ] `tsc`/`build`/`lint` limpos.

---

## Bloco 5 — Admin: visão de vaults por dono + ação reutilizável de publicar

**Objetivo:** dar ao admin/manager uma visão organizada dos vaults dos outros (com o nome do dono) e
uma forma rápida, visual e **reutilizável** de jogar um vault/pasta pra Base Compartilhada.

**Contexto (já feito nesta sessão):** o filtro de dono do admin agora usa usuários reais via
`usersRepo.list()` → `GET /api/users` (manager/admin). O `userMap` do admin já resolve nomes reais.
Este bloco constrói **em cima disso**.

**Onde:** `knowledge/src/routes/admin.tsx`, + provável componente novo reutilizável em
`knowledge/src/components/`.

### 5a. Visão de vaults por dono (organizada, com nome de quem tem o vault)
- Nova aba (ou seção) no admin: "Vaults" — agrupa **pastas + documentos por dono** (usar o mesmo
  agrupamento por `owner_id` que o `Explorer.tsx` já faz em `groups`, mas em modo leitura/curadoria).
- Cabeçalho de cada grupo: avatar + **nome do dono** (via `userMap`, agora real). Contadores
  (nº de pastas, nº de docs) por dono.
- Árvore read-only (ou expandível) das pastas de cada dono. Reaproveitar a lógica de árvore do
  `Explorer` — considerar **extrair um componente de árvore** (`FolderTree` puro, sem as ações de
  edição) que tanto o Explorer quanto o admin usem. Isso já ataca a duplicação.

### 5b. Ação rápida, visual e reutilizável de "Publicar na Base Compartilhada"
- Um componente **reutilizável** `PublishToSharedButton` (ou um hook `usePublishToShared`) que
  receba um documento (ou um conjunto) e publique na Base Compartilhada, com estado visual
  (loading, sucesso, erro via `toast`) e confirmação. Usável **na tela de admin (5a)** e também no
  `WorkspaceDoc` (que hoje tem o botão "Publicar" inline — dá pra unificar).
- **⚠️ Atenção (achado M5 da auditoria):** o publish hoje vai pelo `/data/shared_documents` genérico
  (sem idempotência → double-click duplica) em vez da rota dedicada `/shared/publish`. Este bloco é
  a boa oportunidade de **ligar o componente à rota `/shared/publish`** (com `Idempotency-Key`),
  fechando o M5 de uma vez. Ver `dev/mock-gateway/src/routes/publish.ts`.
- "Jogar um vault/pasta inteira" pra Base Compartilhada = publicar todos os documentos de uma
  pasta/dono em lote. **Decisão de produto:** publicar em lote copia N documentos (cada um vira um
  `shared_document`)? Preserva a estrutura de pastas na Base Compartilhada (que hoje é plana)? Isso
  pode virar extensão de fundação (a Base Compartilhada não tem pastas hoje). **Alinhar com o dono do
  gateway antes** — pode ser Onda 2.

**Decisões em aberto:**
- Extrair `FolderTree` compartilhado (Explorer + admin) — recomendo sim (mata duplicação).
- Publicar **em lote** (vault/pasta inteira) vs só doc-a-doc — o lote provavelmente é extensão de
  fundação (Base Compartilhada plana, sem pastas). Confirmar escopo.
- Unificar o botão "Publicar" do `WorkspaceDoc` com o componente reutilizável novo.

**Critérios de aceite:**
- [ ] Aba/seção "Vaults" no admin mostra pastas+docs agrupados por dono, com nome real do dono.
- [ ] Componente/hook de publicar reutilizável, usado no admin e no WorkspaceDoc.
- [ ] Publish passa a usar `/shared/publish` com idempotência (fecha M5).
- [ ] `tsc`/`build`/`lint` limpos.

---

## Follow-up de fundação (não é um bloco de UI — é o gateway real)

O fix do **filtro de usuários do admin** (feito nesta sessão) depende de `GET /api/users`, que foi
adicionado **só ao mock-gateway local** (`dev/mock-gateway/src/routes/users.ts`). Pra funcionar em
produção, o **gateway real** (`Cerebra-AI/tenant-gateway`) precisa da mesma rota (id, name, email,
role; manager/admin). Até lá, `usersRepo.list()` degrada pra lista vazia em prod (filtro vazio, nomes
"—") — sem crash. É o mesmo item M6 da `AUDITORIA-GERAL-CODIGO-E-ERROS.md`. **Alinhar com o dono do
gateway.**

---

## Resumo dos blocos

| Bloco | Título | Arquivos principais | Precisa de decisão? |
|-------|--------|---------------------|---------------------|
| 1 | Explorer: nomes duplicados | `Explorer.tsx` (+ schema, se server-side) | Sim — escopo (pasta vs global), server-side, pastas também |
| 2 | Grafo: drag + raise + hover | `Graph.tsx` | Sim — vizinhos 1-salto vs cadeia; rótulos sempre vs hover |
| 3 | Grafo: linhas de referência | `Graph.tsx` | Sim — verificar se já aparecem pós-fix; cor |
| 4 | Tela de Ajuda (3 partes) | `routes/help.tsx` (novo), `App.tsx`, `AppShell.tsx` | Sim — 1 página vs abas; formato do conteúdo |
| 5 | Admin: vaults por dono + publicar reutilizável | `admin.tsx`, componente novo, `publish.ts` | Sim — extrair FolderTree; publish em lote (extensão?) |

Todos os blocos são independentes entre si (2 e 3 no mesmo arquivo, fazer em sequência). Cada um fecha
com `tsc`/`build`/`lint` limpos.
