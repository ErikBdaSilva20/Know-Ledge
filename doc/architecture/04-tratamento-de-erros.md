# Knowledge Vault

> **Documento 04 — Tratamento de Erros (Épico 5)**
>
> **Status:** Aprovado
>
> **Escopo:** Envelope de erro canônico, mapa de status HTTP, tipos de erro de domínio no app, logging/correlation-id no gateway, integridade referencial/cascade e resiliência (timeout, retry, idempotência). Implementado tanto no app (`knowledge/src/lib/data/errors.ts`, `client.ts`) quanto no test double local (`knowledge/dev/mock-gateway/`) — a implementação real no `tenant-gateway` compartilhado precisa espelhar o mesmo contrato.

---

# 1. Envelope de erro canônico (Story 5.1)

```json
{ "error": { "code": "forbidden", "message": "Only manager/admin can publish", "request_id": "..." } }
```

Implementado em `knowledge/dev/mock-gateway/src/errors.ts` (`ApiError` + `errorBody()`). Nenhum stack trace, SQL cru, ou nome de tabela/coluna interna sai no corpo — mensagens são amigáveis (Story 5.5 §5 trata a tradução de erro de banco especificamente).

## 1.1 Tipos de erro de domínio no app

`knowledge/src/lib/data/errors.ts` — uma classe `DomainError` com um campo discriminante `type`, em vez de 6 subclasses (menos boilerplate, mesma segurança de `switch (err.type)`):

```ts
type DomainErrorType =
  | "validation" | "unauthorized" | "forbidden"
  | "not_found" | "conflict" | "rate_limited" | "unexpected";
```

`client.ts`'s `api()` é o **único** lugar que traduz `status` → `DomainErrorType` (`domainErrorFromResponse`). Repos nunca veem `Response`/`fetch`/status HTTP — só `DomainError`. `knowledge/src/lib/handleError.ts` centraliza a reação de UI (toast via `sonner`, redirect pro login em `unauthorized`) — aplicado em `Editor.tsx` (auto-save) e `Explorer.tsx` (criar/renomear/excluir/mover); os demais call-sites (`dashboard.tsx`, `workspace-doc.tsx`, `shared-doc.tsx`, `shared.tsx`, `admin.tsx`, `favorites.tsx`) ainda chamam os repos sem tratamento — mesmo padrão, rollout mecânico pendente.

---

# 2. Mapa de status HTTP (Story 5.2)

| Status | Significado | Exemplo no produto |
|---|---|---|
| 400 | corpo/validação inválida | `target_scope` fora do enum |
| 401 | sem sessão | cookie ausente/expirado |
| 403 | RBAC/ownership negado | rep escrevendo em `shared_documents` |
| 404 | recurso inexistente **ou** de outro dono (rep) | `PATCH` de doc de outro rep |
| 409 | conflito | violação de unique constraint |
| 422 | *(reservado, não usado ainda — Épico 6)* | enum semanticamente inválido |
| 429 | *(reservado, não implementado)* | rate limit |
| 500 | erro inesperado | exceção não tratada |

**Política 403 vs 404 (AC#3):** decidida e implementada — `rep` tentando `PATCH`/`DELETE` um registro que não é seu recebe **404**, idêntico a um id inexistente. Não vaza se o recurso existe pra outro dono. Ver `doc/architecture/03-seguranca-zero-trust.md §4` e `knowledge/dev/mock-gateway/src/routes/data.ts`.

**Mapa status → ação de UI (AC#4)**, em `knowledge/src/lib/handleError.ts`: `unauthorized` → redireciona pro login; qualquer outro tipo → toast com a mensagem amigável do `DomainError`.

---

# 3. Logging estruturado e correlation-id (Story 5.3)

Implementado em `knowledge/dev/mock-gateway/src/logging.ts`:

- `requestId` middleware: gera um `crypto.randomUUID()` por request, expõe no header de resposta `X-Request-Id` e no envelope de erro.
- `accessLog` middleware: 1 linha JSON por request — `request_id`, `method`, `route`, `status`, `role` (não o usuário completo), `tenant`, `duration_ms`. **Nunca**: senha, token de sessão, corpo da request/response, PII.
- Erros 5xx: stack logado só no servidor (`console.error` com `request_id`); o cliente recebe só a mensagem amigável + `request_id` (AC#4).
- No tenant-local, `docker compose logs -f gateway` mostra essas linhas (AC#5).
- Responsabilidade é 100% do gateway — o app front não implementa logging de segurança (AC#6), só propaga `request_id` no `DomainError` pra quem quiser reportar.

---

# 4. Integridade referencial, cascade e referências pendentes (Story 5.4)

- Exclusão é **permanente e imediata**, sem lixeira (ADR-002) — confirmado, sem `deleted_at` no schema.
- Cascade via FK real onde existe: `folder.parent_id`, `document.folder_id` → `on delete cascade` (Story 2.2); `document_references.source_document_id`, `shared_document_references.*` → `on delete cascade` (Stories 2.3/2.4).
- Caso polimórfico (`target_document_id`/`document_id`, sem FK): tratado por **convenção + fallback de UI**, não por cascade de banco. O fallback já existe e é melhor que um toast: `knowledge/src/lib/markdown.tsx`'s `MarkdownView` resolve o link no render — se o alvo não existe (ou não é visível), renderiza um `<span>` inerte (não navegável) em vermelho com `title="Documento não encontrado"`, em vez de um `<Link>` quebrado. Não há como clicar num link morto pra começo de conversa.
- Confirmação de exclusão na UI é puramente UX (`ConfirmDialog`) — o gate real de ownership/papel é do gateway (Stories 3.4/3.5), a UI nunca é a última linha de defesa.

---

# 5. Tradução de erros de banco, timeout, pool e idempotência (Story 5.5)

- **Tradução de erro de banco (AC#1):** `knowledge/dev/mock-gateway/src/errors.ts`'s `translatePgError()` — `23505` (unique_violation) → 409, `23503` (foreign_key_violation) → 400, `23514` (check_violation) → 400. Nenhuma mensagem crua do driver `pg` vaza; capturado no `onError` global (`index.ts`).
- **Timeout (AC#2):** `client.ts`'s `api()` usa `AbortController` com 10s de timeout — vira `DomainError("unexpected", ...)`, nunca trava a UI.
- **Idempotência (AC#3):** `POST /shared/publish` aceita header `Idempotency-Key`; uma 2ª chamada com a mesma chave devolve a resposta cacheada (`knowledge/dev/mock-gateway/src/idempotency.ts`, in-memory, TTL de 10min — suficiente pro dev-only harness) em vez de criar um segundo `shared_document`. A UI ainda **não gera** essa chave no clique de "Publicar" — gap sinalizado, é a próxima peça óbvia a fechar antes de considerar Publicar 100% seguro contra duplo-clique real.
- **Pool de conexões (AC#4):** `pg.Pool` (`knowledge/dev/mock-gateway/src/db.ts`) — 1 pool por processo, reaproveitado entre requests, não uma conexão por query.
- **Cold start do Neon (AC#5):** não aplicável ao Postgres local (sem scale-to-zero) — documentado aqui só pra não ser esquecido quando plugar no Neon real: a primeira request após ociosidade pode ter latência maior; a UI já trata isso com estado de loading (não é um caso de erro).
- **Retry/backoff (AC#6):** `client.ts`'s `db.table().list()` faz **1 retry** com 300ms de espera se a falha for `unexpected` (rede/5xx) — só em `GET`, que é idempotente. `create/update/remove` **nunca** retentam sozinhos (risco de duplicar).

---

# 6. Verificado nesta sessão

`npx tsc --noEmit` limpo (app e mock-gateway), `npm run build` limpo, `npm run lint` 0 erros. O roteiro `dev/e2e/roteiro.sh` foi **estendido** com casos pra envelope de erro (code/request_id) e idempotência do Publicar — mas, como as demais peças do Épico 7, não foi executado contra um gateway real nesta sessão (Docker Desktop inacessível). Rodar `dev/e2e/roteiro.sh` continua sendo o próximo passo real de verificação.
