---
baseline_commit: accddbf
---

# Story 4.1: Extensão do gateway — rota de "Publicar na Base Compartilhada"

Status: done

## Story

As a **manager/admin curando conhecimento**,
I want **uma rota server-side que publique um documento pessoal como `shared_document` independente**,
so that **o `published_by` venha da sessão e a cópia seja atômica e autorizada, sem confiar no front**.

## Acceptance Criteria

1. Está documentado **por que Publicar é uma extensão** e não cabe no `/data/:table` genérico: ela (a) lê um `document` (potencialmente de outro dono — cross-owner), (b) cria um `shared_document` **novo e independente**, (c) seta `published_by` a partir da sessão, (d) copia `title`/`content` e grava `source_document_id` (rastreabilidade). [Source: Importantdoc.md#B6][Source: LOVEABLE-BRIEF.md#6]
2. A rota é **gated a manager/admin** no servidor (rep recebe 403), coerente com Story 3.5. [Source: LOVEABLE-BRIEF.md#5.5]
3. A cópia é **independente**: editar depois o `document` ou o `shared_document` não afeta o outro. [Source: LOVEABLE-BRIEF.md#6]
4. `published_by` e `id`/`created_at`/`updated_at` são **server-generated**; o front só envia o `source_document_id` (qual doc publicar). [Source: Importantdoc.md#B5]
5. A rota é definida como pertencente ao **gateway** (`tenant-gateway`), fora do repo do app — precisa de alinhamento com o dono do gateway (não se resolve no template). [Source: Importantdoc.md#B6]
6. Erros são tratados no contrato padrão (Story 5.1/5.2): doc-fonte inexistente → 404; sem permissão → 403; corpo inválido → 400.
7. **Alternativa avaliada e registrada:** fazer no front via 2 chamadas (`list document` + `create shared_document`) — **rejeitada** porque `published_by` server-side e o gate cross-owner exigem servidor; e um rep não pode escrever em `shared_document` de qualquer forma.

## Tasks / Subtasks

- [x] Task 1: Especificar o contrato da rota `POST /shared/publish` (entrada: `source_document_id`; saída: `shared_document`) (AC: #1, #4)
- [x] Task 2: Definir o gate de papel e o comportamento cross-owner (manager publica doc de rep) (AC: #2)
- [x] Task 3: Definir a semântica de cópia independente e a rastreabilidade `source_document_id` (AC: #3)
- [x] Task 4: Mapear erros da rota ao contrato padrão (AC: #6) — linkar Story 5.2
- [x] Task 5: Registrar a análise da alternativa 2-queries e por que foi rejeitada (AC: #7)
- [x] Task 6: Marcar como item de alinhamento com o dono do gateway (AC: #5)

## Dev Notes

- O `/data/:table` **exige sessão** e, para tabela ownerless, escrita só admin/manager — publicar precisa de lógica de cópia + `published_by`, então é rota explícita, como as rotas públicas de LinkHub/Forms citadas no doc. [Source: Importantdoc.md#B6]
- Fluxo de produto: abrir doc (seu ou de um rep) → botão "Publicar" → confirma → aparece na base como cópia independente. [Source: LOVEABLE-BRIEF.md#6][Source: LOVEABLE-BRIEF.md#5.4]
- **Idempotência:** considerar chave de idempotência para evitar publicação duplicada em duplo-clique (Story 6.11). [Source: mentalidadeauditoria.md#5.5]

### Project Structure Notes

- Extensão vive em `tenant-gateway/src/routes/` (repo separado). No app, o `sharedDocuments.repo.ts` ganha um verbo `publish(sourceDocumentId)` que chama essa rota.

### References

- [Source: Importantdoc.md#B6] — Extensões: rotas explícitas no gateway
- [Source: LOVEABLE-BRIEF.md#6] — Fluxo Publicar (cópia independente)
- [Source: LOVEABLE-BRIEF.md#5.5] — só manager/admin publicam

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- Contrato especificado E **implementado como test double** em `knowledge/dev/mock-gateway/src/routes/publish.ts`: `POST /shared/publish { source_document_id }` → 403 se `role==='rep'`, 404 se o `document` não existe, senão `insert into shared_documents (title, content, source_document_id, published_by) ... returning *` com `published_by = session.user.id` — nunca do corpo (AC#2, #4).
- Cross-owner é explícito: o `select` busca por `id` em `documents` sem filtro de `owner_id` — manager/admin publicam doc de qualquer rep, de propósito (AC#2).
- Cópia independente (AC#3): é um `insert`, não há sincronização; editar depois o `document` original ou o `shared_document` publicado não afeta o outro — mesma tabela, sem trigger de espelhamento.
- Erros mapeados ao envelope provisório (`{error:{code,message}}`, `knowledge/dev/mock-gateway/src/errors.ts`) com os status certos: 400 corpo inválido, 403 papel, 404 doc-fonte inexistente (AC#6) — full contrato definitivo é a Story 5.1/5.2, ainda não iniciada.
- Alternativa 2-queries (front faz `list documents` + `create shared_document`) formalmente rejeitada e documentada (AC#7): `published_by` precisa vir do servidor e um rep não pode escrever em `shared_document` de jeito nenhum — só dá pra fazer com lógica server-side.
- **AC#5 continua de pé:** o que existe em `dev/mock-gateway/` é um **test double local**, não a rota real. A extensão de verdade ainda precisa ser construída em `Cerebra-AI/tenant-gateway` pelo dono do gateway — isto só prova que o contrato funciona e dá ao Erik algo pra testar localmente enquanto isso não acontece.
- `sharedDocumentsRepo` do app (`knowledge/src/lib/data/sharedDocuments.repo.ts`) **ainda não tem** um verbo `publish()` chamando essa rota — hoje o botão "Publicar" faz `create` direto em `shared_documents` (2-queries, a alternativa que a AC#7 rejeita). Portar a UI pra usar `POST /shared/publish` fica pendente — sinalizado, não fiz sem validar com o Erik.
- **Achado que contradiz a premissa da AC#7, vale a pena revisar:** a rejeição do "2-queries" assume que ler cross-owner e derivar `published_by` no servidor exigem uma rota dedicada. Mas dado o RBAC já implementado no Épico 3, nenhuma das duas é verdade isoladamente: `manager`/`admin` já recebem **todos** os documentos no `GET /data/documents` genérico (visibilidade por papel, Story 3.3) — não precisam de leitura cross-owner especial —, e `published_by` **já** é sempre derivado da sessão em qualquer `POST /data/shared_documents`, gated a admin/manager (Story 3.5), não só nesta rota. Ou seja: o fluxo que a UI já implementa (abrir o doc que o manager já pode ver, copiar `title`/`content` no client, `create` em `shared_documents`) **já é seguro** com o CRUD genérico — a única coisa que `/shared/publish` ganha de verdade é 1 round-trip a menos e não depender do client já ter o doc carregado. Não é "inseguro sem a rota", é "menos conveniente". Deixo os dois caminhos implementados (mock-gateway tem a rota; app usa o genérico) e sinalizo a divergência para o Erik decidir se vale a pena migrar a UI ou manter como está.

### File List

- `knowledge/dev/mock-gateway/src/routes/publish.ts` (novo — test double da extensão)
- `knowledge/dev/e2e/roteiro.sh` (casos de teste da rota Publicar)
