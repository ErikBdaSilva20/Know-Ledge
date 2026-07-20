# Knowledge Vault

> **Documento 05 — Bloco de Validação (Épico 6)**
>
> **Status:** Aprovado
>
> **Escopo:** As 12 stories do bloco de validação, implementadas no test double local (`knowledge/dev/mock-gateway/`) com Zod no boundary, e algumas peças no app (sanitização de render, concorrência otimista no Editor). A implementação real no `tenant-gateway` compartilhado precisa espelhar o mesmo contrato — nada aqui é código de produção deste repo.

---

# 1. Schema no boundary, whitelist, owner_id/published_by (Stories 6.1, 6.2, 6.3)

`knowledge/dev/mock-gateway/src/schemas.ts` é a **fonte única** — um objeto `SCHEMAS` com um par `{insert, update}` de schema Zod `.strict()` por tabela. `.strict()` faz 3 coisas de uma vez, deliberadamente:

1. **Story 6.1** — todo `POST`/`PATCH` roda `schema.safeParse(body)` antes de tocar o banco (`routes/data.ts`); falha → 400 com o envelope da Story 5.1.
2. **Story 6.3** — como só os campos declarados no schema existem no shape, qualquer chave extra falha a validação. É a whitelist, sem precisar manter uma segunda lista em paralelo (o `tables.ts` antigo tinha `insertable`/`updatable` arrays — removidos, teriam duplicado esta fonte, exatamente o problema que a Story 2.5 já tinha corrigido para `types.gen.ts`/`types.ts`).
3. **Story 6.2** — `owner_id`/`published_by`/`id`/`created_at`/`updated_at` **não estão declarados em nenhum schema** → mandá-los é **400 (reject)**, não um strip silencioso. Isto é uma mudança de política em relação ao que as Stories 1.6/3.1 tinham implementado (strip silencioso nos repos do app, que continua existindo como defesa em profundidade) — a recomendação da própria AC#3 da Story 6.2 ("reject para falhar alto e cedo") venceu. `dev/e2e/roteiro.sh` foi atualizado: o caso de `owner_id` injetado agora espera 400, não mais "criado com o owner certo".

---

# 2. Enums (Story 6.4)

`target_scope`/`document_scope` são `z.enum(["personal", "shared"])` em `schemas.ts` — não `z.string()`. Dupla validação com o `CHECK` do banco (Story 2.3) já existente. Tipos TS já são união literal desde a Story 2.5 (`types.gen.ts`).

---

# 3. Limites de tamanho (Story 6.5)

Constantes nomeadas em `schemas.ts`:

```ts
export const LIMITS = { NAME_MAX: 200, TITLE_MAX: 300, CONTENT_MAX: 200_000 };
```

`title`/`name` exigem `min(1)` (não vazio) e o máximo; `content` só tem máximo (pode ser vazio, documento novo). Acima do limite → 400 pelo próprio Zod. `shared_documents` usa os mesmos limites — mesmos campos, mesma regra.

---

# 4. Referências e FKs de negócio (Story 6.6)

Três funções em `routes/data.ts`, mesmo padrão dos Épicos 3/4:

- `assertOwnedFolder(folderId, ownerId)` — `folder.parent_id`/`document.folder_id`: se não-nulo, precisa existir **e** pertencer ao mesmo dono. **Novo nesta story** (Épico 4 só cobria a validação de `document_references`).
- `assertReferenceTarget(...)` — já existia desde a Story 4.2, mantida.
- `assertFavoriteTarget(scope, documentId, ownerId)` — **novo**: `favorite.document_id` precisa existir e ser visível no scope indicado.

FK real (banco) cobre existência dentro do schema; a regra "mesmo dono" nunca é FK — é sempre validação no gateway (front nunca decide).

---

# 5. Sanitização de Markdown / XSS (Story 6.7)

**Achado real, corrigido nesta story:** `MarkdownView` (`knowledge/src/lib/markdown.tsx`) fazia `dangerouslySetInnerHTML` direto do output de `marked.parse()`, **sem sanitização nenhuma** — um XSS armazenado genuíno (rep escreve `<img src=x onerror=alert(1)>`, manager publica, todo mundo que abre a base compartilhada executa). Corrigido com `DOMPurify.sanitize()` no boundary de renderização:

```ts
const html = DOMPurify.sanitize(marked.parse(seg.value) as string);
```

Modelo de ameaça documentado inline no componente. Conteúdo continua armazenado cru (o servidor só valida tipo/tamanho, Stories 6.1/6.5) — a defesa é 100% na apresentação, nunca no armazenamento (não há upload de arquivo, ADR-004, reduz a superfície).

---

# 6. Rate limiting e tamanho de corpo (Story 6.8)

`knowledge/dev/mock-gateway/src/rateLimit.ts` — limitador de janela fixa em memória, por sessão (ou IP se não autenticado): 60 mutações/minuto. `GET` fica de fora (generoso, AC#6). Excedido → 429.

`hono/body-limit` (built-in) em `index.ts` — 300KB de corpo, independente dos limites por campo da Story 6.5. Acima → 413.

---

# 7. Isolamento de tenant (Story 6.9)

Já implementado desde a Story 7.2 (`middleware.ts`'s `requireTenant`) — esta story só formaliza o caso de teste (`dev/e2e/roteiro.sh`: "X-Tenant-Id errado -> 403", já existente desde o Épico 4).

---

# 8. UUID e campos server-generated (Story 6.10)

- Todo `:id` de rota (`PATCH`/`DELETE /data/:table/:id`) é validado como UUID **antes** de qualquer query — `isUuid()` em `schemas.ts`, formato inválido → 400.
- Todo id em corpo (`parent_id`, `folder_id`, `source_document_id`, `target_document_id`, `document_id`, etc.) já é `z.string().uuid()` nos schemas — coberto pela Story 6.1.
- `id`/`created_at`/`updated_at` nunca são aceitos em nenhum schema de entrada (Story 6.2/6.3) — sempre `gen_random_uuid()`/`now()`/trigger.
- Branded types (`DocumentId`/`FolderId`) — **não implementado**, fica como nice-to-have registrado (AC#6), não crítico o suficiente para o esforço agora.

---

# 9. Concorrência, conflitos e idempotência (Story 6.11)

- **Concorrência otimista (AC#1, #2):** `documents`/`shared_documents` aceitam `expected_updated_at` no `PATCH` (schema em `schemas.ts`, tratado como controle, não coluna, em `routes/data.ts`). Se o valor não bate mais com o do banco → **409**. Implementado ponta-a-ponta: `Editor.tsx` guarda `lastKnownUpdatedAt` (do load e de cada save bem-sucedido) e manda de volta no próximo save; em conflito, `handleDomainError` mostra o toast "Este item foi alterado em outro lugar. Recarregue e tente de novo." — **AC#5 só parcialmente atendido**: o usuário é avisado, não há reaplicação/merge automático da edição pendente.
- **Idempotência do Publicar (AC#3):** já implementada na Story 5.5 (`Idempotency-Key`) — reaproveitada aqui, não duplicada.
- **Unicidade de favorito (AC#4):** já é um índice único no schema (Story 2.3); `translatePgError` (Story 5.5) já traduz a violação (`23505`) em 409 — nada novo a fazer.
- **Retry só em GET (AC#6):** já implementado na Story 5.5 (`client.ts`).

---

# 10. Exclusão permanente é decisão do servidor (Story 6.12)

Nada de código novo — reafirmação de comportamento já implementado: `DELETE /data/:table/:id` sempre passa pelo mesmo gate de ownership/papel do `PATCH` (Stories 3.4/3.5/4-implementação), sem soft-delete (sem coluna `deleted_at` em nenhuma tabela, Épico 2), cascade é sempre FK do banco (Story 5.4). A UI (`ConfirmDialog`) é cosmética — chamar `DELETE` direto, pulando o modal, dá exatamente o mesmo resultado do servidor.

---

# 11. Verificado nesta sessão

`npx tsc --noEmit` limpo (app e mock-gateway), `npm run build` limpo, `npm run lint` 0 erros. `dev/e2e/roteiro.sh` ganhou 7 casos novos (campo desconhecido, enum inválido, título acima do limite, `folder_id` inexistente, id malformado na rota, conflito de concorrência) e teve 1 caso **corrigido** (owner_id injetado agora espera 400, não mais 201-com-owner-trocado). Como em todo o resto desde o Épico 4, **nada rodou contra um Postgres real** — Docker Desktop seguiu inacessível nesta sessão.
