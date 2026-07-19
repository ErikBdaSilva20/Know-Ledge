# Knowledge Vault — Plano de construção

Frontend completo, navegável, com dados mockados persistidos em `localStorage`, pronto para trocar a camada de repositórios pela API real (`list/create/update/remove`).

## Observação sobre stack

O briefing pede **React Router + Vite SPA puro**. O template atual é **TanStack Start** (SSR-capable). Vou trabalhar dentro do TanStack Start usando apenas rotas client-side (sem loaders SSR, sem server functions) — o comportamento é equivalente a uma SPA e mantém o preview funcionando. Toda a lógica de dados fica em memória/localStorage. Se preferir trocar para Vite+React Router puro, me avise antes.

## Arquitetura

```text
src/
  lib/
    types.ts              # tipos das entidades (snake_case)
    mockDb.ts             # store em localStorage + seed
    repos/
      documents.ts        # list/create/update/remove
      folders.ts
      sharedDocuments.ts
      references.ts       # personal + shared
      favorites.ts
      users.ts
    session.ts            # usuário/papel atual (rep/manager/admin)
    graph.ts              # deriva nós/arestas
    backlinks.ts          # deriva "referenciado por"
    markdown.tsx          # render + parser de [[links]]
  components/
    layout/AppShell.tsx   # sidebar fixa + header
    layout/Sidebar.tsx
    RoleSwitcher.tsx
    ConfirmDialog.tsx
    Explorer/…            # árvore de pastas com DnD
    Editor/…              # markdown editor + preview + autocomplete
    Backlinks.tsx
    Graph.tsx             # visualização (canvas/svg simples)
  routes/                 # rotas TanStack, todas client-only
    index.tsx             # redireciona → /dashboard ou /login
    login.tsx
    dashboard.tsx
    workspace.tsx / workspace.$docId.tsx
    shared.tsx / shared.$docId.tsx
    search.tsx
    graph.tsx
    favorites.tsx
    recent.tsx
    admin.tsx (+ subabas)
```

## Camada de dados (crítica)

Todos os repos expõem só **`list()`, `create(data)`, `update(id, data)`, `remove(id)`**. Nada de `getById` no repo — telas fazem `list()` e filtram no cliente. Isso trava o design para casar com a API real.

## Papéis

- Seletor persistente no header (dropdown com 3 usuários seed: Ana Rep, Bruno Manager, Carla Admin).
- Visibilidade calculada no cliente a partir de `session.role`:
  - rep → filtra `owner_id === session.user.id`
  - manager/admin → vê tudo, com avatar/nome do dono
- Botão "Publicar na Base Compartilhada" só aparece p/ manager/admin.

## Telas (cobrindo §5 do briefing)

Login mock, Dashboard (recentes + favoritos + novo), Meu Workspace (Explorer + Editor + Backlinks), Base Compartilhada (lista plana + editar/remover p/ manager+), Busca (título, cliente), Grafo (nós+arestas, cores por escopo), Favoritos, Recentes, Administração (docs, curadoria, usuários somente-leitura, métricas).

## Fluxos

- Novo doc, excluir com confirmação permanente, autocomplete `[[` no editor, backlinks, publicar (cria cópia em `shared_documents` independente), navegação por grafo, salvamento automático com debounce.

## Design

Tailwind v4 + shadcn, tema denso tipo Linear/Notion: sidebar 240px fixa, tipografia sóbria (Inter), foco no conteúdo, densidade alta. Tokens em `src/styles.css`.

## Fora de escopo (confirmado)

Sem upload binário, sem lixeira, sem tempo real, sem auth real, sem busca full-text, sem histórico.

## Entrega

App navegável nos 3 papéis, com seed de exemplo (algumas pastas, docs com `[[referências]]`, 2–3 docs já publicados na Base Compartilhada) para o preview mostrar valor imediatamente.

Confirma que sigo com essa abordagem (rotas TanStack client-only em vez de trocar por Vite+React Router puro)?
