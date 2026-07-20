# Tenant-local (dev-only harness)

**Não é backend de produção do app.** O Knowledge Vault continua sem servidor
próprio (Importantdoc.md §B3) — isto é um harness de teste que reproduz a
topologia da fundação (`[SPA] --HTTPS--> [gateway] --SQL--> [Postgres]`) em
pequena escala, na sua máquina, pra você exercitar login/CRUD/RBAC/Publicar
antes de plugar no `tenant-gateway` real. Nada aqui vai pro bundle de
produção: não entra em `masi.template.json`, não é buildado no publish
(§B10), não é `editable` nem `protect` pela IA.

## O que tem aqui

```
dev/
  docker-compose.yml     Postgres + mock-gateway
  .env.example           config sem segredo (copie pra .env)
  init-db/00_better_auth.sql   tabelas "user"/"session" mínimas
  mock-gateway/           test double do tenant-gateway (Story 7.2, opção B)
```

## Real vs Mock (Story 7.2)

O repo real do gateway (`Cerebra-AI/tenant-gateway`) é privado e não está
disponível aqui — então este harness usa a **opção B**: um mock-gateway
(Hono + Postgres) que reproduz o **contrato**, não o código do gateway real:

- `GET/POST/PATCH/DELETE /data/:table` — só as 4 operações, sem get-by-id.
- `owner_id`/`published_by` sempre derivados da sessão, nunca do corpo da
  request (Story 3.1/3.5).
- Visibilidade por papel: `rep` só vê as próprias linhas em tabela com
  `owner_id`; `manager`/`admin` veem tudo (Story 3.3).
- IDOR: `PATCH`/`DELETE` por id checam posse dentro do próprio `WHERE` da
  query — negado vira **404** (não 403), pra não vazar se o id existe pra
  outro dono (Story 3.4).
- Escrita em tabela sem `owner_id` (`shared_documents`,
  `shared_document_references`) só admin/manager (Story 3.5).
- `POST /shared/publish` — a extensão da Story 4.1: copia um `document`
  (de qualquer dono) pra um `shared_document` novo, com `published_by` da
  sessão.
- Sessão via cookie (`kv_session`, `httpOnly`), **não é o Better-Auth real**
  — só o suficiente pra existir uma sessão com papel.

**Risco de drift** (Story 7.2 AC#5): um mock só vale o que ele reproduz.
Antes de confiar em produção, revalide contra o gateway real.

## Como rodar

```bash
cd knowledge/dev
cp .env.example .env          # ajuste se quiser, senão os defaults bastam
docker compose up -d --build
docker compose logs -f gateway   # confirma "listening on http://localhost:8787"

cd mock-gateway
npm install
npm run seed                     # cria admin/manager/2×rep + dados de exemplo
```

Depois, no app (`knowledge/`):

```bash
cp .env.local.example .env.local
npm run dev
```

O app agora fala com o tenant-local em vez do mock em memória
(`VITE_DATA_SOURCE=gateway`, Story 1.6). Login com qualquer email do seed
(`admin@seed.local`, `manager@seed.local`, `rep1@seed.local`,
`rep2@seed.local`) e senha `password123` — a tela de login mock
(`LoginPage`) ainda não fala com `auth.signIn` de verdade (gap conhecido,
Story 1.6), então autentique via `curl`/Postman contra
`POST http://localhost:8787/api/auth/sign-in/email` por enquanto; o cookie
de sessão fica no browser se você usar `credentials: 'include'` do mesmo
host que o `DEV_ORIGIN` configurado.

## Resetar o ambiente (Story 7.3 AC#6)

```bash
docker compose down -v   # -v derruba o volume do Postgres (apaga tudo)
docker compose up -d --build
# rode o seed de novo
```

## Verificação feita nesta sessão

TypeScript do mock-gateway compila limpo (`npx tsc --noEmit`). **O
`docker compose up` não foi executado nesta sessão** — o daemon do Docker
Desktop não estava acessível no sandbox usado para construir isto. Rode os
passos acima na sua máquina para o primeiro smoke test real.

## Roteiro de teste (Story 7.5)

`dev/e2e/roteiro.sh` — script `curl` executável que roda os fluxos felizes e
todo o checklist de casos negativos de `doc/architecture/03-seguranca-zero-trust.md §6`
contra o stack no ar (precisa do seed rodado):

```bash
cd knowledge/dev/e2e
GATEWAY_URL=http://localhost:8787 TENANT_ID=local-dev ./roteiro.sh
```

Se qualquer caso negativo passar com o resultado errado, é bug crítico
(P0) — a segurança está no lugar errado.
