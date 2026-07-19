# Knowledge Vault

> **Documento 02 — Organização do Frontend**
>
> **Status:** Aprovado
>
> **Escopo:** Estrutura de pastas do React, responsabilidade de cada camada, fluxo de dados ponta-a-ponta e mapeamento pro `editable.allow`/`protect` do `masi.template.json`. Estende o padrão de repos já definido em [Documento 01](./01-stack-e-modelagem.md) §8.

---

# 1. Scaffold base

**`wiki`** (Tailwind v4 + shadcn/ui, design system "Atelier" — `Importantdoc.md` §B9), o mesmo usado por `crm-pro` e `recrutamento`.

Motivo: o Knowledge Vault tem UI densa (sidebar + árvore de pastas + editor + grafo), muito mais próxima do perfil "Pro" do que do scaffold leve `forms-nps`. Aproveitar o shadcn pronto evita reconstruir componentes de árvore/editor do zero.

Consequência direta (regra do scaffold `wiki`, `Importantdoc.md` §B7): além dos protegidos padrão, também ficam **protegidos** `src/components/ui/**`, `src/lib/utils.ts`, `vite.config.ts`, `components.json` e `preview-fixtures.ts`.

---

# 2. Princípio de organização: por camada, não por feature

Decisão: **hooks e lógica de domínio ficam centralizados por camada** (`src/hooks/`, `src/lib/domain/`), não agrupados por feature (`features/documents/`, `features/graph/`...).

Motivo: a fundação já **impõe** essa convenção pros repos — `masi.template.json`'s `editable.allow` usa o glob fixo `src/lib/data/*.repo.ts`, que exige repos num diretório flat. Ter repos flat e hooks/domínio agrupados por feature criaria duas convenções de organização coexistindo no mesmo projeto. Manter tudo por camada é mais consistente e também isola melhor a lógica de negócio sensível (cálculo de grafo, resolução de referência entre vault pessoal/compartilhado) fora do `editable.allow` padrão — só `screens/` e `components/` ficam abertos pra edição por IA do cliente por padrão.

---

# 3. Estrutura de pastas

```
src/
├── main.tsx                        (protegido)
├── App.tsx                         (rotas — não editável por padrão)
├── app.routes.tsx
├── app.css                         (editável)
│
├── lib/
│   ├── data/                       (padrão da fundação — Documento 01 §8)
│   │   ├── client.ts               (protegido)
│   │   ├── types.gen.ts            (protegido)
│   │   ├── folders.repo.ts         (editável)
│   │   ├── documents.repo.ts       (editável)
│   │   ├── sharedDocuments.repo.ts (editável)
│   │   ├── documentReferences.repo.ts       (editável)
│   │   ├── sharedDocumentReferences.repo.ts (editável)
│   │   └── favorites.repo.ts       (editável)
│   │
│   ├── domain/                     (protegido — lógica pura, sem React, sem I/O)
│   │   ├── graph.ts                (monta nós/arestas a partir de documentos + referências)
│   │   ├── backlinks.ts            (deriva "referenciado por" a partir do grafo)
│   │   ├── references.ts           (resolve target_scope personal/shared, valida existência)
│   │   └── search.ts               (filtro por título, em memória)
│   │
│   ├── auth.tsx                    (protegido — sessão + papel via auth.me(), ver ADR B8)
│   ├── format.ts                   (editável — datas, tamanhos de arquivo, etc.)
│   └── utils.ts                    (protegido — helper `cn()` do shadcn)
│
├── hooks/                          (protegido — conecta domain+repos ao estado React)
│   ├── useFolders.ts
│   ├── useDocuments.ts
│   ├── useSharedDocuments.ts
│   ├── useDocumentReferences.ts
│   ├── useFavorites.ts
│   ├── useGraph.ts                 (usa lib/domain/graph.ts)
│   ├── useBacklinks.ts
│   └── useSearch.ts
│
├── components/
│   ├── ui/                         (protegido — primitivas shadcn)
│   ├── layout/                     (editável — AppShell, Sidebar, Header, StatusBar)
│   ├── explorer/                   (editável — FolderTree, DocumentList)
│   ├── editor/                     (editável — MarkdownEditor, MarkdownPreview)
│   ├── graph/                      (editável — GraphView)
│   └── registry.tsx                (protegido)
│
└── screens/                        (editável — composição por rota)
    ├── LoginScreen.tsx             (reaproveitado do scaffold — não mexer, B10)
    ├── WorkspaceScreen.tsx         (vault pessoal: explorer + editor)
    ├── SharedLibraryScreen.tsx     (base compartilhada)
    ├── SearchScreen.tsx
    ├── GraphScreen.tsx
    └── AdminScreen.tsx             (curadoria + gestão — admin/manager)
```

---

# 4. Responsabilidade de cada camada

| Camada | Responsabilidade | Pode importar de |
|---|---|---|
| `lib/data` (repos) | Chamar `db.table('<tabela>')` — só `list/create/update/remove` tipados, zero lógica de negócio | `client.ts`, `types.gen.ts` |
| `lib/domain` | Lógica pura (grafo, backlinks, resolução de referência, busca). Recebe dados já carregados, nunca chama `db` diretamente. Testável sem React. | nada (ou só outros módulos de `domain`) |
| `hooks` | Orquestra: chama repos, aplica `lib/domain`, expõe estado reativo pras screens/components. Aqui mora a decisão de cache (§6). | `lib/data`, `lib/domain` |
| `components` | Apresentação. Recebe dados e callbacks via props. Lógica local pequena pode ficar aqui (ex.: estado de um input); nada de `db`/`domain` direto. | `hooks` (via screens, não diretamente — ver nota abaixo) |
| `screens` | Composição por rota. Chama `hooks`, distribui pra `components`. | `hooks`, `components` |

Nota: components "puros" (layout, editor) idealmente recebem dados via props vindos da screen, em vez de chamar hooks de dados diretamente — mantém `components/` reutilizável e fácil de testar isoladamente. Exceção aceitável: componentes de interação muito específica (ex.: um botão de favoritar dentro de um card) podem chamar `useFavorites()` diretamente para não empurrar prop-drilling desnecessário pela árvore inteira — julgamento caso a caso, não regra rígida.

---

# 5. Fluxo de Dados (resolve o item pendente "Fluxo de Dados")

```
Usuário interage na Screen
        ↓
Screen chama um ou mais hooks (useDocuments, useGraph, ...)
        ↓
Hook chama o(s) repo(s) necessário(s) (lib/data/*.repo.ts)
        ↓
Repo chama db.table('<tabela>').list/create/update/remove
        ↓
Gateway (tenant-gateway) aplica owner_id / papel, resolve o tenant
        ↓
Neon (Postgres do tenant)
        ↓
Gateway devolve a resposta
        ↓
Repo devolve tipado (Document[], SharedDocument[], ...)
        ↓
Hook aplica lib/domain quando necessário (montar grafo, calcular backlinks, filtrar busca)
        ↓
Hook expõe estado pronto pra Screen
        ↓
Screen distribui pras Components
        ↓
Interface atualizada
```

Esse fluxo é o mesmo para vault pessoal e base compartilhada — a única diferença é qual(is) tabela(s) o hook consulta (`documents` vs. `shared_documents`, conforme Documento 01 §4).

---

# 6. Estratégia de Cache

**Decidido: TanStack Query**, uma instância de query por tabela (`['documents']`, `['sharedDocuments']`, `['folders']`, etc.), com invalidação da query correspondente após qualquer `create/update/remove`.

Por quê: o CRUD genérico não tem `getById` nem filtro — todo hook já faz "carregar lista inteira e derivar o resto em memória" (Documento 01 §2). TanStack Query resolve de graça: cache entre navegações, refetch em foco de janela, e principalmente invalidação simples (`queryClient.invalidateQueries(['documents'])` depois de um `create`) sem reimplementar isso à mão em cada hook.

Não é imposição da fundação (Documento 01 §9 já dizia isso) — é escolha do projeto, confirmada.

---

# 7. Mapeamento pro `masi.template.json`

```json
"editable": {
  "allow": [
    "src/screens/**",
    "src/components/layout/**",
    "src/components/explorer/**",
    "src/components/editor/**",
    "src/components/graph/**",
    "src/lib/data/*.repo.ts",
    "src/lib/format.ts",
    "src/app.css"
  ],
  "protect": [
    "src/lib/data/client.ts",
    "src/lib/data/types.gen.ts",
    "src/lib/domain/**",
    "src/lib/auth.tsx",
    "src/lib/utils.ts",
    "src/hooks/**",
    "src/components/ui/**",
    "src/components/registry.tsx",
    "src/main.tsx",
    "vite.config.ts",
    "components.json",
    "preview-fixtures.ts",
    "supabase/migrations/**"
  ]
}
```

`src/hooks/**` e `src/lib/domain/**` entram em `protect` de propósito: é onde mora a regra de negócio (grafo, resolução personal/shared, cache). Deixar isso fora do `editable.allow` padrão evita que uma edição por IA do cliente, pós-clone, quebre a lógica que garante a separação vault pessoal / base compartilhada.

---

# 8. Itens do `pendentes.md` resolvidos por este documento

- **Organização do Frontend** — estrutura completa acima.
- **Fluxo de Dados** — §5.
- **Estado da Aplicação** (parte "onde cada estado vive") — hooks são a camada de estado de servidor; estado de interface (sidebar aberta, documento selecionado, posição do grafo) fica local nas screens/components via `useState`, nunca em `lib/domain` nem em cache de servidor (reafirma ADR-005).
- **Estratégia de Cache** — TanStack Query, confirmado (§6).
