# Follow-ups do Bloco 5 — Gateway real e Publish em lote

Data: 2026-07-21. Origem: pontos deixados **em aberto** ao fechar o Bloco 5
(admin: vaults por dono + publish reutilizável, commit `d98f433`).
Ambos **não são bugs** — são decisões/dependências que saem do escopo de UI e
precisam de alinhamento (com o dono do gateway) ou de uma decisão de produto
antes de codar.

Cada ponto abaixo tem: **o que é**, **por que ficou de fora agora**, **o que
falta fazer** e **decisões em aberto**.

---

## Ponto 1 — Publicar um vault/pasta inteira na Base Compartilhada (publish em lote)

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
- **Dono do gateway** confirma o contrato de `/api/users` e a existência de
  `/shared/publish` no real (paridade com o mock).
- Escopo da idempotência no real: o mock hoje faz cache **só por chave**; um
  gateway de produção deveria escopar por **(usuário, chave)** — anotado no
  próprio `publish.ts`.

---

## Nota adicional (fora dos dois pontos) — unificar `FolderTree`

Não é um dos dois follow-ups acima, mas fica registrado: o `FolderTree`
read-only novo (`knowledge/src/components/FolderTree.tsx`, usado no admin) e a
árvore **editável** do `Explorer` (`knowledge/src/components/Explorer.tsx`) são
hoje componentes separados — de propósito (curadoria read-only vs edição com
drag/rename). Unificá-los é um refactor **opcional** de futuro; só vale se a
duplicação incomodar, e sem desestabilizar o Explorer.
