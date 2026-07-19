# Knowledge Vault — Briefing para construção do Frontend

> **Para quem lê isso:** você vai construir **só o frontend** desta aplicação. O backend real (autenticação, banco de dados, API) já existe em uma fundação própria (MasIA) e será conectado depois, por outra equipe. Este documento explica o produto, as telas, os papéis de usuário, e as regras técnicas que precisam ser seguidas desde já para que essa conexão futura seja simples.
>
> Leia este documento inteiro antes de começar. As regras técnicas da seção 2 não são preferência de estilo — são restrições reais de uma infraestrutura já existente (documentadas em `Importantdoc.md`, anexado junto com este arquivo).

---

# 1. O que é o produto

**Knowledge Vault** é uma base de conhecimento corporativa, inspirada em Obsidian (vault, pastas, links entre documentos, grafo de conhecimento), GitHub (renderização de Markdown) e Notion (navegação/organização visual) — mas não é clone de nenhum dos três.

- Cada usuário tem seu **próprio vault pessoal**: cria, organiza e edita documentos em Markdown, dentro de pastas.
- Documentos podem **referenciar outros documentos** (links internos), formando uma rede de conhecimento navegável — com **backlinks** ("referenciado por") e uma **visualização em grafo**.
- Existe uma **Base de Conhecimento Compartilhada**: administradores/managers podem pegar um documento (seu ou de qualquer membro da equipe) e **publicá-lo** para que todos os usuários da empresa possam ler.
- O produto não tem nicho fixo — deve servir qualquer empresa que precise organizar conhecimento interno (softwares house, escritórios, agências, consultorias, etc.).

**O que o produto NÃO é:** não é um clone do Obsidian/Notion, não é um sistema de armazenamento de arquivos, não é um editor de código, não lida com upload de arquivo (PDF, DOCX, imagens, etc.) — **o único tipo de conteúdo é Markdown**. Isso foi uma decisão explícita para manter o escopo pequeno.

---

# 2. Regras técnicas obrigatórias (não são negociáveis)

## 2.1 Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 |
| Build | Vite (SPA — **sem Next.js, sem SSR/SSG**) |
| Linguagem | TypeScript **strict** |
| Rotas | React Router (`BrowserRouter`) |
| Estilo | **Tailwind CSS v4 + shadcn/ui** (design system denso, tipo "Atelier" — pense em algo como Linear/Notion: sidebar fixa, densidade de informação alta, sóbrio) |

## 2.2 Este é um trabalho SÓ de frontend — regras de dados

- **Não conecte a nenhum backend real.** Não use Supabase (mesmo que seja seu padrão), não use Firebase, não crie rotas de API, não use nenhum banco de dados real.
- Use **dados mockados em memória** (ou `localStorage`, se ajudar a persistir entre reloads durante o desenvolvimento) para simular o comportamento da aplicação.
- **Estruture o acesso a dados como se já fosse a API real**, para que a troca por integração de verdade depois seja só trocar a implementação interna, sem mudar telas/componentes. Concretamente: crie uma camada de "repositórios" (ex.: `documentsRepo.list()`, `documentsRepo.create(data)`, `documentsRepo.update(id, data)`, `documentsRepo.remove(id)`) que hoje mexe no mock, mas tem a cara de uma chamada de API.
- **A API real do backend, quando existir, só vai ter estas 4 operações por tabela: `list`, `create`, `update`, `remove`.** Não existe "buscar um item pelo ID" nem "filtrar no servidor". Ou seja: **estruture toda tela pensando em "carreguei a lista inteira, e filtro/procuro no frontend"** — não desenhe nenhuma tela nem lógica que dependa de "buscar só 1 item específico do servidor" ou de "mandar um filtro pro servidor". Isso é crítico: se isso for ignorado, o trabalho de reconexão com o backend real depois vai exigir redesenhar telas.
- Todo registro tem um dono implícito (quem criou) — mas **quem é o dono nunca é escolhido pela tela**, é sempre definido pela sessão de quem está logado. Não crie campos de formulário do tipo "atribuir a", exceto onde explicitamente descrito abaixo (publicação para a base compartilhada).

## 2.3 O que NUNCA fazer

- Next.js, SSR, SSG.
- Supabase, Firebase, qualquer BaaS.
- Upload de arquivo binário (PDF, DOCX, imagens, etc.) — só existe Markdown.
- Lixeira / restauração de item excluído — **exclusão é sempre permanente e imediata**, com uma confirmação clara antes.
- Tela ou fluxo que dependa de "buscar 1 item específico por ID no servidor" ou de "mandar filtro/busca pro servidor" — tudo é lista completa + filtro no cliente.
- Colaboração em tempo real, comentários, histórico de versões, plugins.

---

# 3. Modelo de dados (o "banco de dados" mockado)

Estas são as entidades. Modele os mocks e os tipos TypeScript exatamente com esses campos (nomes em `snake_case`, porque é assim que o backend real vai devolver os dados):

## `folder`
```ts
{
  id: string
  owner_id: string        // dono (o usuário logado no mock)
  parent_id: string | null  // pasta pai, ou null se for raiz
  name: string
  created_at: string
  updated_at: string
}
```

## `document` (vault pessoal — Markdown)
```ts
{
  id: string
  owner_id: string
  folder_id: string | null
  title: string
  content: string          // markdown puro
  created_at: string
  updated_at: string
}
```

## `shared_document` (Base de Conhecimento Compartilhada)
```ts
{
  id: string
  title: string
  content: string
  source_document_id: string | null  // de qual "document" pessoal isso foi publicado (só rastreabilidade, exibir "publicado a partir de...")
  published_by: string               // quem publicou
  created_at: string
  updated_at: string
}
```
Não tem `owner_id` nem `folder_id` — é uma lista plana, visível a todos, sem dono.

## `document_reference` (links dentro do vault pessoal)
```ts
{
  id: string
  owner_id: string
  source_document_id: string   // sempre um "document" pessoal
  target_scope: 'personal' | 'shared'
  target_document_id: string   // aponta pra "document" (se personal) ou "shared_document" (se shared)
  created_at: string
}
```

## `shared_document_reference` (links dentro da base compartilhada)
```ts
{
  id: string
  source_shared_document_id: string
  target_shared_document_id: string
  created_at: string
}
```
Um documento compartilhado só pode linkar para outro documento compartilhado (nunca para um documento pessoal de alguém — quebraria o link pra quem não é o dono).

## `favorite`
```ts
{
  id: string
  owner_id: string
  document_scope: 'personal' | 'shared'
  document_id: string
  created_at: string
}
```

## Regras derivadas (nunca armazenadas, sempre calculadas)

- **Backlinks**: para um documento X, é a lista de referências (`document_reference` + `shared_document_reference`) cujo alvo é X.
- **Grafo**: nós = todos os documentos visíveis pro usuário atual (pessoais + base compartilhada); arestas = as duas tabelas de referência.
- **Busca**: filtro simples por título, sobre documentos + pastas, em memória.
- **Recentes**: últimos documentos abertos — pode ser só estado local (não precisa nem entrar no mock de "banco").

---

# 4. Papéis de usuário

Existem 3 papéis. Para o mock, crie um **seletor de papel simples** (ex.: um dropdown no canto, ou 3 usuários pré-cadastrados de exemplo) pra dar pra alternar entre as 3 experiências sem precisar de login real — login/autenticação de verdade vem do backend, depois.

| Papel | Quem é | Visibilidade |
|---|---|---|
| **Rep** | Membro comum da equipe | Vê e edita **só os próprios** documentos/pastas no vault pessoal. Vê a Base Compartilhada inteira (mas não pode editá-la). |
| **Manager** | Gestor de equipe | Vê e edita **todos os documentos de todos os usuários** (não só os próprios). Pode **publicar/editar/remover** documentos na Base Compartilhada. |
| **Admin** | Controle total | Tudo que o Manager pode, mais: visualizar todos os usuários e seus papéis, reorganizar estrutura de qualquer usuário. |

No mock, isso significa: dependendo do papel selecionado, a lista de "documentos" que a tela de Workspace mostra muda (Rep = só os dele; Manager/Admin = todos, com indicação visual de quem é o dono de cada um).

---

# 5. Estrutura de telas

## 5.1 Navegação geral

Layout fixo: **Sidebar** sempre visível à esquerda + **Área Principal** à direita (topo com Header, rodapé opcional com Status Bar). Pense em Obsidian/Linear, não em um site de marketing.

Sidebar contém, sempre visíveis:
- Meu Workspace
- Base Compartilhada
- Busca
- Grafo
- Favoritos
- Recentes
- Administração (só aparece se o papel atual for `admin` ou `manager`)

## 5.2 Tela: Login (mock)

Simples — nome/e-mail + um seletor de papel (rep/manager/admin) pra simular quem está entrando. Não precisa validar senha de verdade.

## 5.3 Tela: Dashboard (tela inicial após login)

Mostra: documentos recentes, documentos favoritos, atalho para criar novo documento. Objetivo: retomar o trabalho rapidamente.

## 5.4 Tela: Meu Workspace

A tela principal. Dividida em:
- **Explorer** (dentro da sidebar ou num painel à esquerda da área principal): árvore de pastas + documentos, com drag-and-drop para mover, e ações de criar pasta / criar documento / renomear / mover / excluir (com confirmação — sem lixeira).
- **Editor**: quando um documento é aberto, mostra editor Markdown + preview lado a lado (ou alternável). Salvamento automático (alguns segundos após parar de digitar, sem botão "salvar" manual).
- Dentro do editor, o usuário consegue **inserir uma referência** para outro documento (pessoal ou da Base Compartilhada) — algo como um autocomplete/menção ao digitar `[[`.
- Ao abrir um documento, mostrar uma seção **"Referenciado por"** (backlinks) — outros documentos que apontam para este.

Para **Manager/Admin**: a mesma tela, mas a árvore de documentos inclui os de todos os usuários (com indicação de quem é o dono de cada item — ex.: um avatar/nome ao lado). Ao abrir um documento de outra pessoa, aparece um botão **"Publicar na Base Compartilhada"**.

## 5.5 Tela: Base de Conhecimento Compartilhada

Lista plana (sem pastas) de todos os documentos publicados. Todo mundo pode ler.

- **Rep**: só leitura. Pode abrir, navegar pelas referências, favoritar.
- **Manager/Admin**: além de ler, podem editar o conteúdo publicado diretamente, remover da base compartilhada, e criar referências entre documentos compartilhados.

Cada item mostra: título, quem publicou, e (se fizer sentido visualmente) uma nota discreta "publicado a partir de [documento original]".

## 5.6 Tela: Busca

Campo de busca + lista de resultados, filtrando por título (documentos + pastas, pessoal + compartilhado). Ao clicar num resultado, abre o documento.

## 5.7 Tela: Grafo

Visualização de nós (documentos) e arestas (referências), navegável — clicar num nó abre o documento correspondente. Documentos pessoais e da Base Compartilhada aparecem no mesmo grafo (visualmente pode-se diferenciar por cor).

## 5.8 Tela: Favoritos / Recentes

Listas simples dos documentos marcados como favorito / abertos recentemente, com acesso rápido.

## 5.9 Tela: Administração (só `admin`/`manager`)

- **Gestão de documentos**: visão de todos os documentos da empresa, com filtros simples (por usuário, por pasta), ações de reorganizar/mover/excluir.
- **Curadoria da Base Compartilhada**: lista do que está publicado, com ação de editar/remover.
- **Gestão de usuários** (só visualização por enquanto, sem CRUD de usuário — isso é de autenticação/backend, fora de escopo): lista de usuários da empresa e seus papéis (rep/manager/admin).
- Métricas simples: quantidade de documentos, quantidade de pastas, documentos publicados.

---

# 6. Fluxos principais (o que o usuário vive)

**Criar documento:** botão/atalho "Novo documento" → escolhe pasta (ou raiz) → documento criado com título vazio/padrão → editor abre automaticamente.

**Excluir documento ou pasta:** ação de excluir → modal de confirmação deixando claro que é **permanente e não pode ser desfeito** → some da lista. Se for pasta com conteúdo dentro, avisar que tudo dentro também será excluído.

**Criar referência:** dentro do editor, ao digitar algo como `[[`, abre um autocomplete listando documentos (pessoais + compartilhados) para linkar. Clicar num link dentro de um documento navega até o destino; se o destino não existir mais, mostrar um toast "documento não encontrado" e não navegar.

**Publicar para a Base Compartilhada** (só manager/admin): abrir um documento (seu ou de um rep) → botão "Publicar" → confirma → aparece na Base Compartilhada como uma cópia independente (editar depois um lado não afeta o outro — deixe isso implícito/visualmente claro, não precisa explicar tecnicamente pro usuário).

**Buscar:** digitar na busca → resultados aparecem conforme digita, filtrando por título → clicar abre o documento.

**Navegar pelo grafo:** abrir a tela de grafo → ver todos os nós conectados → clicar num nó abre o documento correspondente.

---

# 7. Princípios de design (pra guiar decisões visuais)

- A interface deve parecer uma **biblioteca de conhecimento**, não um explorador de arquivos nem um editor de código.
- Prioridade: rapidez, simplicidade, poucos cliques, foco no conteúdo escrito.
- O documento (o texto) é sempre o protagonista visual — a UI nunca deve competir com ele.
- Toda ação destrutiva (excluir) precisa de confirmação clara. Ações não-destrutivas (salvar, mover, favoritar) devem ser instantâneas, sem confirmação.
- Estado vazio (pasta vazia, sem documentos ainda) deve orientar o próximo passo, não parecer quebrado.

---

# 8. Fora de escopo (não implementar nada disso agora)

- Upload de arquivo de qualquer tipo (PDF, DOCX, imagem, etc.).
- Lixeira / histórico de versões / desfazer exclusão.
- Colaboração em tempo real, comentários, edição simultânea.
- Login/autenticação real (fica mockado — ver seção 4).
- Notificações, integrações externas, IA integrada.
- Busca por conteúdo (full-text) — só título por enquanto.

---

# 9. Entrega esperada

Um frontend navegável, com dados mockados, cobrindo todas as telas da seção 5, funcionando nos 3 papéis (alternáveis via o seletor mockado), pronto para depois substituirmos a camada de dados mockada pela integração com o backend real — sem precisar redesenhar telas, só trocar a implementação dos "repositórios" de dados.
