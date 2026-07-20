# Knowledge Vault

> **Documento 03 — Segurança e Zero-Trust (Épico 3)**
>
> **Status:** Aprovado
>
> **Escopo:** Consolida os 5 invariantes de autorização que o `tenant-gateway` aplica sobre as tabelas do Épico 2, confirma (por auditoria de código) que o frontend deste repo não os viola, e especifica os casos de teste negativos que a Story 7.5 deve automatizar contra um gateway real. **Nenhum destes invariantes é implementado neste repo** — são comportamento do gateway compartilhado (`Cerebra-AI/tenant-gateway`, fora deste código). O que este documento e o código deste repo garantem é que o frontend **nunca finge ser o boundary de segurança**.

---

# 1. `owner_id` é derivado da sessão — nunca vem do front

**Invariante:** o gateway seta `owner_id` a partir da sessão autenticada em todo `POST`/`PATCH`. Se o front mandar `owner_id` no corpo, o gateway ignora/rejeita — nunca confia. [Source: Importantdoc.md#B5]

**Auditoria deste repo (feita nesta story):** `documentsRepo`, `foldersRepo`, `documentReferencesRepo`, `favoritesRepo` — em modo `gateway`, todos fazem `const { owner_id, ...rest } = data; return table.create(rest)` antes de chamar `POST /data/:table` (`knowledge/src/lib/data/*.repo.ts`, Story 1.6). Nenhum formulário da UI tem campo "atribuir a outro usuário" — confirmado em `Explorer.tsx` (criar doc/pasta usa sempre `user.id` da sessão local) e `dashboard.tsx`. A única exceção documentada é a Publicação (§5 abaixo), que usa `published_by`, não `owner_id`.

**Caso de teste negativo (roteiro p/ Story 7.5, não executado aqui — sem gateway local disponível):**
```
POST /data/documents  { title: "x", folder_id: null, owner_id: "<id de outro usuário>" }
  autenticado como rep A
  esperado: registro criado com owner_id = id do rep A (sessão), owner_id injetado é ignorado
```

---

# 2. `role` no front é só cosmético

**Invariante:** o gateway resolve o papel a partir da sessão; `role` no client só esconde/mostra botões. Forjar `role` no estado do front não muda nenhuma permissão real. [Source: Importantdoc.md#B8]

**Auditoria deste repo:** `knowledge/src/lib/session.tsx` expõe `can(perm)` — usado só para condicionar renderização (`AdminPage` redireciona se `!can("publishShared")`; `RoleSwitcher`/botão "Publicar" só aparecem condicionalmente). Nenhum desses `can()` é consultado antes de uma chamada de rede para decidir se ela "deveria" funcionar — a chamada sempre acontece contra `db.table()`, e é o gateway que aceita ou nega. Este repo **não tem** `src/lib/auth.tsx` separado como o exemplo genérico da fundação sugere — `session.tsx` já cumpre esse papel (hidrata `{user, role}` de `auth.me()` em modo gateway, Story 1.6); manter os dois arquivos separados criaria duas fontes de sessão.

**Caso de teste negativo (Story 7.5):**
```
PATCH /data/shared_documents/:id  { title: "hack" }
  autenticado como rep, com role="admin" forjado no estado do client (DevTools)
  esperado: 403 do gateway (role real da sessão é rep) — a UI forjada não muda a resposta HTTP
```

---

# 3. Visibilidade por papel é decidida pelo gateway, não pelo front

**Invariante e matriz** já documentados em `doc/architecture/01-stack-e-modelagem.md §4`. Resumo: `rep` recebe só as próprias linhas em `GET` de tabelas com `owner_id`; `manager`/`admin` recebem todas; `shared_documents`/`shared_document_references` (sem `owner_id`) são legíveis por qualquer logado. [Source: Importantdoc.md#B8][Source: Importantdoc.md#B4]

**Front-filter ≠ gateway-filter:** o front (`search.tsx`, `admin.tsx`) filtra listas por `q`/`ownerFilter` para **busca/UX** — sobre dados que o gateway **já autorizou** a devolver. Nenhum filtro no front é a última linha de defesa contra vazamento; se o gateway devolvesse dados não autorizados, o front os exibiria. Isso é aceitável porque o corte de autorização é responsabilidade exclusiva do gateway (Importantdoc.md §B1).

**Caso de teste negativo (Story 7.5):**
```
GET /data/documents  autenticado como rep A
  esperado: 0 linhas com owner_id != rep A, mesmo que existam documentos de outros usuários no tenant
GET /data/documents  autenticado como manager
  esperado: linhas de todos os owners
```

---

# 4. IDOR — posse verificada em `PATCH`/`DELETE` por id

**Invariante:** `PATCH/DELETE /data/:table/:id` só tem efeito se o registro pertence ao `owner_id` da sessão ou o papel é manager/admin; caso contrário, negado (código exato de status é decisão da Story 5.2, fora deste repo). Como o modo genérico não tem `get-by-id`, os únicos vetores de IDOR são `update`/`remove` por id — leitura já é cortada na origem por §3. [Source: mentalidadeauditoria.md#5.6][Source: Importantdoc.md#B5]

**Auditoria deste repo:** todo `*Repo.update(id, patch)`/`*Repo.remove(id)` chamado pela UI (`Editor.tsx`, `Explorer.tsx`, `workspace-doc.tsx`, `shared-doc.tsx`, `admin.tsx`, `favorites.tsx`) manda só `id` + o patch de negócio (título, conteúdo, nome, `parent_id`) — nunca decide localmente "posso fazer isso", nunca passa `owner_id`. A decisão de posse é 100% do gateway.

**Caso de teste negativo (Story 7.5):**
```
PATCH /data/documents/:id  (id pertence ao rep B)
  autenticado como rep A
  esperado: negado, sem alteração no registro
```

---

# 5. Escrita na Base Compartilhada — gate automático por ausência de `owner_id`

**Invariante:** `shared_documents`/`shared_document_references` não têm `owner_id` → o gateway trata como lookup: leitura livre, escrita (`POST/PATCH/DELETE`) só admin/manager. Isso **não exige código de autorização** — é o comportamento padrão do gateway para qualquer tabela ownerless (o achado arquitetural do produto, `doc/architecture/01-stack-e-modelagem.md §5.1`). [Source: Importantdoc.md#B4.1]

**Auditoria deste repo:** botão "Publicar" (`workspace-doc.tsx`, `shared.tsx`) e ações de editar/remover na base compartilhada (`Editor.tsx`, `admin.tsx`, `shared-doc.tsx`) só renderizam quando `can("publishShared"/"editShared")` — gate de UI. A chamada de rede em si (`sharedDocumentsRepo.create/update/remove`) não checa papel localmente; se um rep a disparasse mesmo sem o botão visível, o gateway a negaria.

**Caso de teste negativo (Story 7.5):**
```
POST /data/shared_documents  { title: "x", content: "", source_document_id: null }
  autenticado como rep
  esperado: 403, nenhum shared_document criado
```

---

# 6. Checklist de testes negativos (input pronto pra Story 7.5)

Nenhum destes foi executado — não há gateway local nesta sessão. Consolidados aqui para virar automação quando o E7 (tenant-local Docker) subir:

- [ ] `owner_id` injetado no `create` é ignorado (§1)
- [ ] `role` forjado no client não muda resposta HTTP (§2)
- [ ] `rep` em `list` não recebe linhas de outro `owner_id` (§3)
- [ ] `manager`/`admin` em `list` recebem todas as linhas (§3)
- [ ] `rep` em `update`/`remove` de registro de outro dono é negado (§4)
- [ ] `rep` em `create`/`update`/`remove` de `shared_documents`/`shared_document_references` é negado (§5)
