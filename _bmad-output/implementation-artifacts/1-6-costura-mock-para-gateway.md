---
baseline_commit: 6de259e96aa22e09d3e6abdf7c005d4f5eebf364
---

# Story 1.6: Costura mock → gateway (a troca sem redesenhar telas)

Status: done

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

### File List

- `knowledge/src/lib/data/dataSource.ts` (novo)
- `knowledge/src/lib/data/*.repo.ts` (6 arquivos — branch mock/gateway, ver Story 1.5)
- `knowledge/src/lib/session.tsx` (branch `isGatewayMode()` em `SessionProvider`)
- `knowledge/.env.example` (novo — documenta `VITE_DATA_SOURCE`)
