# Follow-ups do Bloco 5 — Gateway real e Publish em lote

Data: 2026-07-21. Origem: pontos deixados **em aberto** ao fechar o Bloco 5
(admin: vaults por dono + publish reutilizável, commit `d98f433`).
Ambos **não são bugs** — são decisões/dependências que saem do escopo de UI e
precisam de alinhamento (com o dono do gateway) ou de uma decisão de produto
antes de codar.

Cada ponto abaixo tem: **o que é**, **por que ficou de fora agora**, **o que
falta fazer** e **decisões em aberto**.

> **Atualização (mesmo dia, commit `4a73f90`):** investigando a rota genérica
> `/data/:table` (`dev/mock-gateway/src/data.ts` + `tables.ts`), descobri que
> ela **já** cobre tudo que `/shared/publish` cobria em segurança — role gate
> e `published_by` derivado da sessão — para a tabela `shared_documents`
> (`serverDerivedColumn: "published_by"`, `ownerVisibility: false`). A única
> coisa que a rota dedicada adicionava de fato era **idempotência de
> servidor**. Isso abriu dois contornos **sem tocar no gateway real**,
> aplicados agora: **Ponto 1 (publish em lote) resolvido**; **Ponto 2 — só a
> parte de `/shared/publish` resolvida** (com uma troca documentada abaixo); a
> parte de `/api/users` **continua bloqueada** (não há como contornar sem
> alguma rota que devolva nomes). Deixei o restante do documento como estava
> pra registrar o raciocínio original — as seções abaixo têm uma nota de
> status no topo.

---

## Ponto 1 — Publicar um vault/pasta inteira na Base Compartilhada (publish em lote)

> **✅ Resolvido (commit `4a73f90`).** `PublishManyButton`
> (`knowledge/src/components/PublishToSharedButton.tsx`) publica em lote,
> achatado (sem tentar preservar pastas na Base Compartilhada — decisão abaixo
> confirmada como a de menor risco). Wired em dois escopos na aba "Vaults" do
> admin: **vault inteiro** (lista de docs já flat por dono) e **pasta inteira**
> (`collectDocsInSubtree`, novo em `FolderTree.tsx`, recursivo — inclui
> subpastas). Progresso ao vivo "N/total" + toast de resumo
> (sucesso/parcial/falha). Zero mudança de schema ou de gateway. O texto
> original abaixo (o "porquê" e as decisões) continua válido — só o "o que
> falta fazer" do lote achatado foi feito.

### O que é

No Bloco 5 pediu-se uma forma de "jogar um vault/pasta inteira" para a Base
Compartilhada — ou seja, publicar **N documentos de uma pasta (ou de um dono)
de uma só vez**, e não só documento por documento.

Hoje o que existe é **publish unitário**: o componente `PublishToSharedButton`
(`knowledge/src/components/PublishToSharedButton.tsx`) publica **um** documento
por vez, via `sharedDocumentsRepo.publish()` → rota `POST /shared/publish`.

### Por que ficou de fora agora

A Base Compartilhada **é plana**: ela não tem o conceito de pastas. O modelo de
dados de `shared_documents` guarda `title`, `content`, `source_document_id` e
`published_by` — **não há `folder_id` nem hierarquia** (ver
`knowledge/src/lib/data/sharedDocuments.repo.ts` e a rota
`knowledge/dev/mock-gateway/src/routes/publish.ts`).

Consequência: publicar "uma pasta inteira" hoje só poderia significar **achatar**
— copiar cada documento da pasta como um `shared_document` solto, **perdendo a
estrutura de pastas** que o dono tinha. Isso é uma **decisão de produto**, não um
detalhe de implementação:

- Se a Base Compartilhada **deve** espelhar pastas, isso é uma **extensão de
  fundação** (novo conceito de pasta compartilhada no schema + no gateway +
  na UI da Base Compartilhada) — bem maior que o Bloco 5.
- Se **não** deve (fica plana), publicar em lote é aceitável, mas o usuário
  precisa entender que a organização em pastas **não** viaja junto.

Fazer isso "no chute" arriscaria criar uma fundação errada (pastas
compartilhadas meia-boca) ou surpreender o usuário (estrutura sumindo). Por isso
foi **deferido** — é o tipo de decisão que se alinha antes de escrever código.

### O que falta fazer (depende da decisão)

- **Se lote achatado (mais simples):** um `publishFolder(folderId)` /
  `publishVault(ownerId)` que itera os documentos e chama `publish()` para cada
  um, com **uma única barra de progresso** e um **resumo** ("12 de 12
  publicados"). Idempotência por documento continua valendo. Sem mudança de
  schema.
- **Se preservar pastas (extensão de fundação):** modelar pasta compartilhada
  (`shared_folders` ou equivalente) no schema (`supabase/migrations/…`), expor
  no gateway e refletir na tela da Base Compartilhada. **Muito maior** — provável
  Onda 2.

### Decisões em aberto (alinhar com o dono do gateway / produto)

- A Base Compartilhada **deve ganhar pastas** ou permanece plana?
- Publish em lote **substitui** cópias já publicadas do mesmo documento (upsert)
  ou sempre cria novas? (hoje o unitário sempre cria uma nova cópia).
- Recomendação: **manter plana + lote achatado com resumo** como primeira
  entrega; pastas compartilhadas só se o produto pedir de fato.

---

## Ponto 2 — Rotas que só existem no mock-gateway precisam existir no gateway real

> **Status por rota (commit `4a73f90`):**
> - **`POST /shared/publish` — contornado, não depende mais do gateway real.**
>   `sharedDocumentsRepo.publish()` agora chama a rota **genérica**
>   `POST /data/shared_documents` (que já deve existir em produção — é a
>   espinha dorsal do CRUD do produto). Ela já força **role gate**
>   (`ownerVisibility: false` → só manager/admin escreve) e **`published_by`
>   derivado da sessão** (`serverDerivedColumn`), nunca do cliente — os dois
>   pontos de segurança que importavam. **Trade-off aceito:** perde a
>   idempotência **de servidor** contra double-submit; sobra a defesa do
>   **front** (`PublishToSharedButton`/`PublishManyButton` desabilitam o
>   botão enquanto publicam), que cobre o caso comum (duplo-clique na mesma
>   aba) mas não uma corrida genuína entre abas/dispositivos. Ver nota de
>   segurança no fim desta seção.
> - **`GET /api/users` — continua bloqueado.** Não existe nenhum outro dado
>   (em `documents`/`folders`/`shared_documents`) que carregue **nome** de
>   usuário — só `owner_id`/`published_by` (uuid). Sem alguma rota de
>   listagem, é estruturalmente impossível resolver nomes reais no front.
>   Nenhum contorno elimina isso; na melhor das hipóteses dá pra **mitigar** a
>   degradação (ex.: mostrar o nome do próprio usuário logado via
>   `useSession()`, e um rótulo estável tipo `"Usuário #a3f1"` em vez de "—"
>   para os demais) — não implementado ainda, é só uma ideia de mitigação.
>   Vale perguntar ao dono do gateway se o Better-Auth já expõe algo
>   equivalente (plugin de admin/organização) antes de assumir que só dá pra
>   mitigar.

### O que é

Duas rotas de que o Bloco 5 depende hoje **só estão implementadas no
mock-gateway local** (`knowledge/dev/mock-gateway/`). Para funcionar em
**produção**, o **gateway real** (`Cerebra-AI/tenant-gateway`) precisa das
mesmas rotas:

1. **`GET /api/users`** — roster de usuários registrados (id, name, email, role;
   manager/admin apenas). Alimenta o filtro por dono, a aba "Usuários" e a
   resolução de nomes reais na aba "Vaults".
   - Mock: `knowledge/dev/mock-gateway/src/routes/users.ts` (montada em
     `index.ts` → `/api/users`).
   - Consumidor no front: `knowledge/src/lib/data/users.repo.ts`.

2. **`POST /shared/publish`** — publish dedicado e **idempotente** (deriva
   `published_by` da sessão, copia `title`/`content` do documento-fonte no
   servidor, aceita `Idempotency-Key`). É o que fecha o achado **M5**
   (double-click duplicando publicação).
   - Mock: `knowledge/dev/mock-gateway/src/routes/publish.ts` (montada em
     `index.ts` → `/shared/publish`).
   - Consumidor no front: `sharedDocumentsRepo.publish()` em
     `knowledge/src/lib/data/sharedDocuments.repo.ts`.

### Por que isso importa (e por que foi tratado assim)

O `client.ts` (`knowledge/src/lib/data/client.ts`) é **PROTECTED** e só fala a
superfície genérica `/data/:table`. Rotas fora disso (`/api/users`,
`/shared/publish`) são chamadas por **fetch direto** contra o gateway — o mesmo
padrão que o `usersRepo` já usava. Ou seja: **o front está pronto** e aponta para
essas rotas; quem precisa existir do outro lado é o **gateway real**.

Comportamento hoje, se o gateway real **não** tiver as rotas:

- `GET /api/users` ausente → `usersRepo.list()` **degrada para lista vazia**
  (sem crash): filtro de dono vazio, nomes aparecem como "—" na aba Vaults. É o
  mesmo item **M6** da `AUDITORIA-GERAL-CODIGO-E-ERROS.md`.
- `POST /shared/publish` ausente → publish **falha com erro claro** (toast via
  `handleDomainError`), **não** silenciosamente. Nada é duplicado, mas nada é
  publicado até a rota existir.

A escolha de **degradar em vez de quebrar** é proposital (o front não deve
assumir que a fundação já chegou), mas isso **não substitui** implementar as
rotas no gateway real — enquanto elas não existirem, esses recursos ficam
**inertes em produção**.

### O que falta fazer

- Implementar **`GET /api/users`** no `Cerebra-AI/tenant-gateway` com o mesmo
  contrato do mock (id, name, email, role; **manager/admin only**, `rep` → 403).
- Confirmar/implementar **`POST /shared/publish`** no gateway real conforme a
  **Story 4.1** (idempotência por `Idempotency-Key`, `published_by` da sessão,
  cópia cross-owner permitida só a manager/admin). O mock segue a story; falta
  garantir que o real também.

### Decisões em aberto

- **Dono do gateway** confirma o contrato de `/api/users` (segue bloqueado) e,
  se algum dia quiser fechar o gap de idempotência de servidor, se vale a pena
  implementar `/shared/publish` de verdade — hoje o front **não depende mais**
  dela pra funcionar.
- Escopo da idempotência no real, **se** a rota dedicada vier a existir: o
  mock hoje faz cache **só por chave**; um gateway de produção deveria
  escopar por **(usuário, chave)** — anotado no próprio `publish.ts`.

### Nota de segurança — idempotência apenas no front

Ao chamar a rota genérica em vez da dedicada, a proteção contra
double-submit passou a ser **só client-side** (botão desabilitado durante o
request). Isso cobre o caso comum (duplo-clique na mesma aba), mas **não**
cobre: duas abas publicando o mesmo documento ao mesmo tempo, ou um retry
manual após um erro de rede que na verdade teve sucesso no servidor.
Consequência de uma falha nesse cenário: **dois `shared_documents` idênticos**
na Base Compartilhada (poluição, não corrupção — nenhum dado é perdido, e
qualquer um dos dois pode ser removido pela curadoria do admin). Risco
considerado aceitável para destravar a feature agora; se a duplicação
incomodar na prática, a correção de verdade é a rota dedicada idempotente no
gateway real (ver acima) — não um contorno adicional no front.

---

## Nota adicional (fora dos dois pontos) — unificar `FolderTree`

Não é um dos dois follow-ups acima, mas fica registrado: o `FolderTree`
read-only novo (`knowledge/src/components/FolderTree.tsx`, usado no admin) e a
árvore **editável** do `Explorer` (`knowledge/src/components/Explorer.tsx`) são
hoje componentes separados — de propósito (curadoria read-only vs edição com
drag/rename). Unificá-los é um refactor **opcional** de futuro; só vale se a
duplicação incomodar, e sem desestabilizar o Explorer.
