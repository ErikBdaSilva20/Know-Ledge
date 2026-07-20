---
baseline_commit: accddbf
---

# Story 7.1: Docker Compose do tenant-local (Postgres + gateway) — dev-only

Status: review

## Story

As a **Erik querendo testar os fluxos localmente**,
I want **um `docker-compose` que suba um Postgres local (simulando Neon) e o gateway**,
so that **eu exercite login, CRUD, RBAC e Publicar de verdade antes de plugar no gateway compartilhado**.

## Acceptance Criteria

1. Existe um `docker-compose.yml` (na raiz de um diretório `dev/` do projeto, fora do bundle de produção) que sobe: um serviço **Postgres** (simula o Neon do tenant) e o serviço **gateway** (real ou mock — Story 7.2). [Source: Importantdoc.md#B1][Source: Importantdoc.md#B2]
2. Está explicitamente rotulado como **dev-only**: não vai para o R2/Cloudflare, não entra no `masi.template.json`, não é buildado no publish. [Source: Importantdoc.md#B3][Source: Importantdoc.md#B10]
3. O Postgres é inicializado com as **tabelas do Better-Auth** (que o gateway cria) **e depois** a migration do app (`0001_business_schema.sql`) — na ordem correta (Story 2.1). [Source: Importantdoc.md#B4]
4. Variáveis de conexão (URL do Postgres, porta do gateway) são configuráveis via `.env` local, sem segredos comitados. [Source: mentalidadeauditoria.md#5.6]
5. `docker compose up` deixa o gateway acessível em `http://localhost:<porta>` para o app apontar (Story 7.4). [Source: Importantdoc.md#B5]
6. `docker compose logs` mostra os logs estruturados do gateway (Story 5.3) para depurar fluxos de erro. [Source: mentalidadeauditoria.md#5.1]

## Tasks / Subtasks

- [x] Task 1: Escrever o `docker-compose.yml` (Postgres + gateway) em `dev/` (AC: #1, #2)
- [x] Task 2: Definir a ordem de bootstrap do schema (Better-Auth → migration do app) (AC: #3) — linkar Story 7.3
- [x] Task 3: Definir `.env.example` local sem segredos (AC: #4)
- [ ] Task 4: Validar acesso e logs (AC: #5, #6)

## Dev Notes

- O tenant-local **reproduz** a topologia da fundação (gateway + 1 Postgres) em pequena escala. Não substitui produção; serve para validar os fluxos. [Source: Importantdoc.md#B1][Source: Importantdoc.md#B2]
- **Importante:** isto não viola "sem backend por-app" (§B3) — não é backend de produção do app; é um harness de teste do contrato do gateway. Deixar isso escrito no README de `dev/`. [Source: Importantdoc.md#B3]
- Postgres local ≈ Neon; sem scale-to-zero, mas o schema e o contrato são iguais. Cold start (Story 5.5) não ocorre local, então testar loading separadamente.

### Project Structure Notes

- `dev/docker-compose.yml`, `dev/.env.example`, `dev/README.md`. Nada disso em `editable.allow`/bundle de produção.

### References

- [Source: Importantdoc.md#B1] — topologia gateway + Neon
- [Source: Importantdoc.md#B2] — onde tudo mora
- [Source: Importantdoc.md#B4] — ordem do schema (Better-Auth antes)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- `docker compose up` / `docker ps` retornaram erro de conexão com o daemon (`open //./pipe/dockerDesktopLinuxEngine`) — Docker Desktop não estava acessível no sandbox desta sessão. Não foi possível validar Task 4 (AC#5, #6) nesta sessão.

### Completion Notes List

- `knowledge/dev/docker-compose.yml`: serviço `postgres` (16-alpine) + serviço `gateway` (build de `./mock-gateway`), com `depends_on: condition: service_healthy` (AC#1).
- Rotulado dev-only: vive inteiro em `knowledge/dev/`, fora de `masi.template.json`/`editable`/`protect`, com aviso explícito em `dev/README.md` (AC#2).
- Ordem de bootstrap (AC#3): `docker-entrypoint-initdb.d/00_better_auth.sql` (tabelas `user`/`session`) roda antes de `01_business_schema.sql` (cópia montada de `../supabase/migrations/0001_business_schema.sql`) — Postgres executa scripts de init em ordem alfabética, garantido pelo prefixo numérico.
- `.env.example` sem segredo real — senha do Postgres é um placeholder óbvio (`kv_local_dev`), tudo local e descartável com o volume (AC#4).
- **Task 4 não verificada nesta sessão** (ver Debug Log) — `npx tsc --noEmit` do mock-gateway está limpo, mas `docker compose up` real, acesso em `localhost:8787` e `docker compose logs` ficam pendentes de rodar na máquina do Erik. Status marcado `review`, não `done`, por isso.

### File List

- `knowledge/dev/docker-compose.yml` (novo)
- `knowledge/dev/.env.example` (novo)
- `knowledge/dev/init-db/00_better_auth.sql` (novo)
- `knowledge/dev/README.md` (novo)
