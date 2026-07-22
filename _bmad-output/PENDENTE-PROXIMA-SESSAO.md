# Pendente — retomar na próxima sessão

Pedido do Erik, feito no fim de uma sessão com contexto crítico.

## 1. Tela de registro (sign-up) — ✅ feito

`GatewayLoginForm` em `knowledge/src/routes/login.tsx` agora tem toggle
sign-in/sign-up, chamando `auth.signUp(name, email, password)`. Erro de e-mail
duplicado (409/`conflict`) ganhou mensagem própria (o texto genérico de conflict
é sobre edição concorrente de documento, não serviria aqui). Papel continua
100% automático (Importantdoc.md §B8: 1º usuário do tenant = `admin`, resto =
`rep`) — sem seletor de papel na tela; Erik confirmou que isso é aceitável por
ora, já que `manager`/`admin` têm quase as mesmas permissões (`session.tsx`'s
`permsFor()`) e `manager` pode nem chegar a ser usado.

Verificado ponta a ponta contra o gateway real: signup cria usuário com role
`rep`, e email duplicado retorna 409 tratado corretamente pela UI.

## 2. Preview mockado dos 3 papéis (rep/manager/admin) — ✅ feito

Escape hatch dev-only em `knowledge/src/lib/data/dataSource.ts`
(`isDevPreviewActive`/`setDevPreviewActive`, gated por `import.meta.env.DEV`):
um link "Preview mockado (dev)" na tela de login (modo gateway) flipa a app
pra mock mode em runtime sem editar `.env.local`; um badge no `AppShell` deixa
sair do preview e voltar pro gateway real.

## Estado do ambiente local (pra retomar rápido)

- `knowledge/dev/docker-compose.yml` foi editado à mão pelo Erik (sem variáveis
  `${VAR:-default}`, valores fixos): Postgres em `localhost:5432`, user `KnowLedge`,
  senha `dev`, banco `knowdb`. Gateway em `localhost:8787`.
- Containers `dev-postgres-1`/`dev-gateway-1` devem estar rodando (`docker compose ps`
  em `knowledge/dev/` pra confirmar).
- Seed: `DATABASE_URL="postgres://KnowLedge:dev@localhost:5432/knowdb" npm run seed`
  dentro de `knowledge/dev/mock-gateway/`.
- Usuários de teste: `admin@seed.local` / `manager@seed.local` / `rep1@seed.local` /
  `rep2@seed.local`, senha `password123` pra todos.
- Última verificação: `dev/e2e/roteiro.sh` passou 22/22 contra esse setup.
