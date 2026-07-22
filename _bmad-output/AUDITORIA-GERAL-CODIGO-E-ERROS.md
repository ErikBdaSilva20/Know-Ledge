# Auditoria geral — código, tratamento de erros, async, performance e dados mockados

Data: 2026-07-21. Autor: Amelia (code review adversarial, camadas geral + edge-case).
Escopo: **todo o código de primeira mão** — `knowledge/src/**` (exceto os 47 componentes
vendored `components/ui/**` do shadcn) + `knowledge/dev/mock-gateway/src/**` + schema/infra
(`supabase/migrations`, `Database/`, `dev/docker-compose.yml`). ~6.000 linhas revisadas.

Modo: `no-spec` (sem story de referência) — auditoria de projeto inteiro, não de um diff.

> **Nada aqui foi corrigido.** É um levantamento pra vocês priorizarem. No fim tem uma ordem
> sugerida separando _quick wins_ (fix mecânico) de _precisa de decisão_.

---

## TL;DR — o que dói de verdade

| # | Sev | Área | Onde | Quebra o quê |
|---|-----|------|------|--------------|
| H1 | 🔴 | async / erro | `src/lib/data/client.ts:122` + `src/lib/session.tsx:48,58` | `auth.me()` sem try/catch nem timeout → **unhandled rejection** na hidratação de sessão; queda de rede deixa o usuário deslogado sem feedback |
| M1 | 🟠 | infra / CORS | `dev/mock-gateway/src/index.ts:25` + `dev/docker-compose.yml` | CORS travado em `:5173`, mas o Vite cai pra `:5174` quando 5173 está ocupado → **todo o modo gateway quebra** ("Failed to fetch") |
| M2 | 🟠 | async / erro | `src/lib/session.tsx:79` + `AppShell` | `logout()` sem try/catch → rejection não tratada, não navega pro /login |
| M3 | 🟠 | bundle / clareza | `src/main.tsx:3,12` | `@tanstack/react-query` provisionado e **nunca usado** — peso morto + engana quem lê |
| M4 | 🟠 | dados / schema | `Database/setupNeon.sql` vs `supabase/migrations/0001_business_schema.sql` | **dois schemas divergentes**; só um é a fonte da verdade |
| M5 | 🟠 | arquitetura | `dev/mock-gateway/src/routes/publish.ts` (dead) + `workspace-doc.tsx:107` | rota `/shared/publish` (idempotente, cross-owner) **nunca é chamada**; publish vai pelo `/data` genérico → double-click duplica |
| M6 | 🟠 | dados mockados | `src/lib/session.tsx:30` + telas | nome de dono/publicador **sempre errado em gateway** (resolve contra os 4 usuários fake do mock) |
| M7 | 🟠 | rate limit | `Editor.tsx` autosave + `syncRefs.ts` + `rateLimit.ts:11` | edição pesada de doc com muitos links pode estourar 60 mutações/min → 429 |
| M8 | 🟠 | auth / UX | `src/App.tsx:78-92` | `/login` pisca no refresh em gateway; **trava no login** se `auth.me()` falhar mesmo com cookie válido |
| M9 | 🟠 | performance | `src/components/Graph.tsx:147-204` | força O(n²) × 160 frames na thread principal → trava com vault grande |
| L1..L9 | 🟡 | vários | ver abaixo | cruft/perf de mock, leaks de dev, FOUC, dead code, lixo no repo |

**O que já está sólido (não mexer):** o envelope de erro `DomainError` (`errors.ts`), o RBAC
zero-trust com ownership atômica no `WHERE` do SQL (`data.ts`), a sanitização única com DOMPurify
(`markdown.tsx`), o timeout+retry idempotente do `db.table.list()` (`client.ts`), e a validação
`.strict()` que faz dobrar de whitelist (`schemas.ts`). A base de segurança está bem feita.

---

## 🔴 Alto

### H1 — `auth.me()` sem tratamento de erro nem timeout → unhandled rejection

`src/lib/data/client.ts:122-133`:
```ts
async me(): Promise<Session> {
  if (isPreview()) return { user: null, role: null };
  const { gatewayUrl, tenantId } = resolveConfig();
  const res = await fetch(`${gatewayUrl}/api/auth/get-session`, { /* sem signal/timeout */ });
  if (!res.ok) return { user: null, role: null };
  const data = await res.json();   // ← throw se o corpo não for JSON
  ...
}
```
Diferente do `api()` logo acima (que tem `AbortController` + `try/catch` + `DomainError`),
`auth.me()` usa `fetch` cru: **sem timeout** e **sem try/catch**. Se o gateway estiver fora do ar,
lento, ou responder um HTML de erro de proxy, `fetch`/`res.json()` lançam um `TypeError`/erro cru.

Cascata (é o que mais dói): `session.tsx:48` `refreshGatewaySession()` faz `await auth.me()` sem
proteger, e o `useEffect` de montagem (`session.tsx:58`) chama `refreshGatewaySession()` **sem
`await` e sem `.catch()`**. Resultado: **unhandled promise rejection** (exatamente o
`[Unhandled rejection] TypeError: Failed to fetch → Object.me → refreshGatewaySession` que aparece
no log do Vite), e o usuário fica preso deslogado sem nenhuma mensagem — mesmo tendo cookie válido.

**Correção:** envolver o `fetch` de `auth.me()` no mesmo padrão do `api()` (AbortController +
try/catch retornando `{ user:null, role:null }` em falha de rede, em vez de lançar); e proteger a
chamada em `refreshGatewaySession`/no efeito com `.catch()`. Root-cause: `auth.me()` deveria falhar
"soft" (sessão indeterminada), nunca lançar.

---

## 🟠 Médio

### M1 — CORS preso em `:5173` enquanto o Vite serve em `:5174`

`dev/mock-gateway/src/index.ts:25`:
```ts
cors({ origin: process.env.DEV_ORIGIN ?? "http://localhost:5173", credentials: true, ... })
```
`dev/docker-compose.yml` fixa `DEV_ORIGIN: http://localhost:5173`. Mas quando a porta 5173 já está
ocupada (comum — outra instância do Vite), o Vite **cai automaticamente pra 5174** (visto no log:
`Port 5173 is in use, trying another one... http://localhost:5174/`). Com `credentials: true`, o
navegador **bloqueia toda requisição** de `:5174` pro gateway → "Failed to fetch" em tudo. Forte
candidato à causa raiz do "não tá conversando corretamente" em modo gateway.

**Correção:** ou fixar a porta do Vite (`server.port: 5173, strictPort: true` no `vite.config.ts`),
ou aceitar uma lista/regex de origens localhost no CORS do harness (`origin: [5173, 5174]` ou uma
função que valida `localhost:*` em dev). A segunda é mais robusta.

### M2 — `logout()` sem try/catch → rejection não tratada

`src/lib/session.tsx:79-86` faz `await auth.signOut()` (que lança `DomainError` em falha de rede) sem
proteger, e o botão no `AppShell` faz `onClick={async () => { await logout(); navigate("/login") }}`
sem `.catch`. Se o signOut falhar, o `navigate` não roda e sobra rejection não tratada — o usuário
clica "Sair" e nada acontece. **Correção:** try/catch no `logout()` limpando o estado local mesmo
se a chamada de rede falhar (logout deve ser sempre "best-effort" do lado servidor, mas definitivo
no cliente).

### M3 — `@tanstack/react-query` provisionado e nunca usado

`src/main.tsx` monta `QueryClientProvider`, mas **nenhum** `useQuery`/`useMutation` existe no
projeto (grep confirma: só o import/setup em `main.tsx`). A camada de dados é os repos custom +
`useGatewayList`/`useDb`. É ~13KB gzip de dependência morta no bundle **e** engana: um dev novo
assume que os dados passam por cache do react-query (com invalidação), quando não passam.
**Correção:** remover a dependência e o provider (fix mecânico), ou — se for intenção futura —
migrar de fato os repos pra react-query (decisão de arquitetura, aí ganharia cache/refetch de graça
e resolveria vários "refetch manual" das telas).

### M4 — Dois arquivos de schema divergentes

Existem `Database/setupNeon.sql` **e** `supabase/migrations/0001_business_schema.sql`, e eles
**diferem** (121 vs 136 linhas, conteúdo trocado). A fonte da verdade é a `supabase/migrations`
(referenciada por `masi.template.json` e por `src/lib/data/types.gen.ts`). O `Database/setupNeon.sql`
é uma cópia que derivou — quem rodar o arquivo errado provisiona um schema diferente (inclusive a
precisão `timestamptz(3)` que já custou um bug). **Correção:** eliminar/reconciliar o `Database/`
duplicado e deixar uma fonte única.

### M5 — `/shared/publish` é dead code; publish real usa o `/data` genérico

`dev/mock-gateway/src/routes/publish.ts` existe (com idempotência via `Idempotency-Key`, cópia
server-side do documento fonte e checagem cross-owner) mas **nunca é chamado**: o botão "Publicar"
em `workspace-doc.tsx:107` chama `sharedDocumentsRepo.create(...)` → `POST /data/shared_documents`.
Consequências:
- **sem idempotência** → double-click (ou click + autosave concorrente) cria **dois**
  `shared_documents`. A rota `/shared/publish` foi construída justamente pra evitar isso.
- publica `title`/`content` **enviados pelo front** (podem estar stale — ver observação no bloco 1
  da auditoria anterior) em vez da cópia server-side do documento fonte.

**Correção:** ligar o publish à rota dedicada (`db` precisa de um método/rota explícita, ou um
`sharedDocumentsRepo.publish(sourceId)` que bata em `/shared/publish` com `Idempotency-Key`). Decisão
de arquitetura leve, mas real.

### M6 — Nome de dono/publicador sempre errado em modo gateway

`session.tsx:30` fixa `MOCK_USER_ID = "u_carla"` e as telas (`Explorer`, `admin`, `shared`,
`workspace-doc`, `shared-doc`) resolvem nomes via `userMap` montado a partir dos **4 usuários fake
do `mockDb`** (`u_ana`/`u_bruno`/`u_carla`/`u_diego`). Em gateway, os ids reais dos usuários
(`seed-rep-1`, UUIDs do sign-up…) **nunca** batem com esses → o nome sai `undefined`/`—`. Já é um gap
conhecido (não há endpoint de listagem de usuários no gateway), mas continua sendo **dado errado na
tela** em produção. **Correção:** endpoint de usuários no gateway (extensão de fundação) ou, no
mínimo, exibir um placeholder honesto em vez de resolver contra dados mockados.

### M7 — Autosave + syncRefs podem estourar o rate limit

`Editor.tsx` faz autosave a cada 500ms de ociosidade; cada save = 1 `PATCH` + `syncAllRefsFor` (que
em gateway faz 3 `list()` + N `create`/`remove` de referências). O limite em `rateLimit.ts:11` é 60
mutações/min (1/s). Edição contínua de um doc com muitos `[[links]]` mudando pode acumular várias
mutações por save e bater 429 — o `catch` do autosave mantém `dirty=true`, mas o usuário vê "muitas
tentativas, aguarde". O diff no syncRefs já ajudou (vs apagar-e-recriar tudo), mas ainda são várias
chamadas. **Correção:** agrupar o sync de refs numa única rota "replace-all" no gateway, ou subir o
teto/dar folga pro autosave. Precisa de decisão (mexe no contrato do gateway).

### M8 — `RequireAuth` pisca `/login` e pode travar no refresh (gateway)

`App.tsx:78-92`: no primeiro render em gateway, `user` é `null` (antes do `auth.me()` resolver), então
o efeito redireciona pra `/login`; quando `auth.me()` resolve, redireciona de volta — **flash de
login** em todo refresh. Pior: se `auth.me()` falhar (ver H1), `user` fica `null` pra sempre → usuário
**preso no login mesmo com cookie válido**. **Correção:** um estado de "sessão carregando" (enquanto
`auth.me()` não resolveu, não redirecionar) — resolve o flash e, junto com o H1, o travamento.

### M9 — Grafo O(n²) × 160 frames na thread principal

`Graph.tsx:147-204`: a simulação de força roda, a cada abertura/resize, 160 frames de cálculo
pairwise O(n²) (`for i … for j>i`) na main thread. Com um vault grande (centenas de nós) isso é
160 × n² operações → trava/janка visível ao abrir o grafo. Ok pra vaults pequenos. **Correção:**
limitar iterações por tamanho, usar Barnes-Hut/quadtree, ou jogar a simulação pra um Web Worker.
Otimização (não urgente até o vault crescer).

---

## 🟡 Baixo

- **L1** — `mockDb.mutate` faz `JSON.parse(JSON.stringify(state))` (clone integral do DB) a cada
  mutação (`mockDb.ts:91`). O(tamanho total) por save. Só modo mock (dev).
- **L2** — `rateLimit.ts:18` o `Map buckets` nunca é expurgado → cresce indefinidamente (leak). Dev.
- **L3** — `authRoutes.ts:61` "primeiro usuário vira admin" via `count==0` tem corrida: dois sign-ups
  concorrentes na tabela vazia viram ambos admin. Dev-mock, improvável.
- **L4** — Em gateway, `documents.repo.remove` confia no cascade do Postgres, que só limpa
  `document_references` onde o doc é **`source`** (tem FK). Referências onde ele é **`target`**
  (polimórfico, sem FK) ficam órfãs e acumulam. O mock limpa os dois lados; o gateway não.
- **L5** — Favoritar com double-click cria favoritos duplicados (toggle lê `favorite` de lista
  carregada no mount; sem unique `(owner, scope, doc)` no schema aparente). Des-favoritar remove um só.
- **L6** — `theme.tsx:15` inicia sempre `"light"` e lê o dark num efeito → **FOUC** (flash claro) pra
  quem usa dark; ignora `prefers-color-scheme`.
- **L7** — `mockDb.ts:77` `persist()` faz `localStorage.setItem` sem try/catch → `QuotaExceededError`
  em DB grande lança de dentro do `mutate`. Mock.
- **L8** — `src/lib/data/users.repo.ts` é **dead code** (sem nenhum caller, sem branch de gateway;
  o próprio comentário admite). Lixo removível.
- **L9** — Diretório lixo `~/AppData` na raiz do repo (criado por um `~` literal em algum comando de
  shell no Git Bash). Aparece como untracked, polui a árvore. Remover.

---

## Dados mockados que podem causar problema (pedido explícito)

1. **4 usuários fake do `mockDb` vazando pro modo gateway** (`mockDb.ts:39-44`). São usados pra
   resolver nome de dono/publicador **em ambos os modos** → em gateway, nome sempre errado (M6). Este
   é o maior "landmine" de dado mockado hoje.
2. **`MOCK_USER_ID = "u_carla"` acoplado ao seed** (`session.tsx:30`). Se alguém mexer nos ids do
   seed do mock, o login mock quebra silenciosamente (resolve pra `null`).
3. **`users.repo.ts` morto** (L8) — só fala com o mock, sem branch de gateway; um dia alguém importa
   achando que traz usuários reais.
4. **`useDb`/`mockDb` vivos em modo gateway** — histórico da auditoria anterior
   (`AUDITORIA-DADOS-MOCKADOS-E-BUGS.md`), já corrigido nas telas de leitura, mas a resolução de
   usuário (itens acima) é o resquício que sobrou.

Nada disso é "mock que quebra em produção de forma catastrófica" — o pior efeito hoje é **nome errado
na UI** (M6). Mas é dívida que precisa fechar quando o endpoint de usuários existir.

---

## Ordem sugerida de correção

**Quick wins (fix mecânico, sem decisão):**
1. **H1** — blindar `auth.me()` (try/catch + timeout) e `refreshGatewaySession`/`logout` com `.catch`.
   É o que para a unhandled rejection e o travamento no login. **Maior impacto, menor risco.**
2. **M1** — fixar porta do Vite (`strictPort`) ou aceitar `localhost:*` no CORS do harness.
3. **M2** — try/catch no `logout()`.
4. **M3** — remover `@tanstack/react-query` (se não for usar).
5. **L2/L7/L8/L9** — expurgo de bucket, guard no persist, apagar `users.repo.ts` e o `~/AppData`.

**Precisa de decisão (produto/arquitetura):**
- **M4** (qual schema é a verdade), **M5** (ligar o `/shared/publish`), **M6** (endpoint de
  usuários), **M7** (rota de sync de refs em lote / teto do rate limit), **M8** (estado de
  "sessão carregando"), **M9** (otimizar/worker no grafo), **L4** (limpeza de refs órfãs).

---

## Cobertura desta auditoria

Lidos por completo: `client.ts`, `errors.ts`, `session.tsx`, `mockDb.ts`, `useDb.ts`, `App.tsx`,
`main.tsx`, `theme.tsx`, `recents.ts`, `handleError.ts`, `lovable-error-reporting.ts`, `markdown.tsx`,
`highlight.ts`, `syncRefs.ts`, `backlinks.ts`, `useGatewayList.ts`, `Explorer.tsx`, `Editor.tsx`,
`Graph.tsx`, `Backlinks.tsx`, todos os `*.repo.ts`, e no gateway: `index.ts`, `data.ts`,
`middleware.ts`, `auth.ts`, `authRoutes.ts`, `publish.ts`, `errors.ts`, `rateLimit.ts`, `logging.ts`,
`db.ts`, `seed.ts`, `schemas.ts`, `tables.ts`, `validation.ts`, além das migrations e do
`docker-compose.yml`. Excluídos: os 47 componentes vendored `components/ui/**` (shadcn, não é código
de primeira mão).
