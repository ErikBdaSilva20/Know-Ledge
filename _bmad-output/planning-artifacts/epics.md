> ⛳ **Comece pelo arquivo de controle:** `../START-AQUI.md` — ele diz por onde começar, onde
> paramos e a regra obrigatória de marcar progresso. Este `epics.md` é só o índice/contexto.

# Épicos & Stories — Backend do Knowledge Vault (Fundação MasIA)

> **Autora:** Mary (Business Analyst · BMad)
> **Data:** 2026-07-19
> **Escopo:** SOMENTE arquitetura, boas práticas, tratamento de erros e validação do **backend**. Nada de código nesta fase.
> **Fonte-da-verdade técnica:** `Importantdoc.md` (contrato da fundação MasIA — seguir à risca).
> **Fonte de produto:** `LOVEABLE-BRIEF.md` (Knowledge Vault). **Régua de qualidade:** `mentalidadeauditoria.md`.

---

## 1. Tese arquitetural (leia antes de tudo)

O Knowledge Vault **não tem backend próprio**. O backend de todos os apps do hub é o **`tenant-gateway`** compartilhado (Hono) + **Neon** (1 Postgres por tenant) + **Better-Auth**. Ver `Importantdoc.md §B1`.

Definir "a arquitetura do backend" deste app significa, na prática, **três superfícies** — e nada além disso:

1. **Schema no Neon** (a migration) — a única peça de backend por-app (`Importantdoc.md §B4`).
2. **Mapeamento do modelo do produto contra o RBAC do gateway** — onde mora a segurança (zero-trust).
3. **Extensões explícitas do gateway** — só o que o CRUD genérico `/data/:table` não cobre (ex.: "Publicar").

### 1.1 Achado crítico de RBAC (fundamenta E3 e E6)

O gateway **recusa escrita em qualquer tabela sem `owner_id`** vinda de quem não é admin/manager (`Importantdoc.md §B4.1`). Cruzando com o modelo do brief:

| Entidade | Tem `owner_id`? | Quem escreve | Comportamento no gateway |
|---|---|---|---|
| `folder` | ✅ sim | rep (dono) | tabela de dono: rep vê/edita só os seus; manager/admin veem tudo |
| `document` | ✅ sim | rep (dono) | idem |
| `document_reference` | ✅ sim (filha) | rep (dono) | **precisa** de `owner_id` senão rep toma 403 ao salvar |
| `favorite` | ✅ sim (filha) | rep (dono) | idem |
| `shared_document` | ❌ não (lista plana) | manager/admin | **tratada como lookup**: leitura a todo logado, **escrita só admin/manager** |
| `shared_document_reference` | ❌ não (lista plana) | manager/admin | idem lookup |

> **Consequência de ouro:** a regra de produto "rep só lê a base compartilhada; manager/admin publicam/editam" é implementada **automaticamente** pela ausência de `owner_id` nas tabelas compartilhadas — sem escrever uma linha de autorização. A segurança do produto **cai exatamente** na mecânica do gateway. Isto é o eixo do pedido de zero-trust.

### 1.2 O que NÃO precisa de backend novo

Backlinks, grafo, busca e "recentes" são **derivados no front** (list-then-filter) — `LOVEABLE-BRIEF.md §3` e `Importantdoc.md §B5`. Não há realtime, jobs, webhooks, pagamento nem mídia → **cabe no CRUD genérico** (`Importantdoc.md §A3`). A única extensão real é a rota de **Publicar** (E4).

### 1.3 Enquadramento confirmado (decisões do Erik)

- **NÃO** construímos servidor próprio (Express/Nest/Next) — proibido por `§B3`. "Construir o backend" = **schema Neon + costura da camada de dados ao gateway compartilhado**.
- A **camada de dados ("controllers")** mora em `src/lib/data/` (raiz), isolada do fluxo de UI (`src/screens`, `src/components`) — **invariante arquitetural** (E1). `client.ts`/`types.gen.ts` ficam protegidos; `errors.ts` traduz erro do gateway; um `*.repo.ts` por entidade.
- Existe um **tenant-local (E7)**: harness de dev via **Docker** que reproduz o contrato do gateway (Better-Auth + `/data/:table` + RBAC + `owner_id` da sessão) para testar os fluxos localmente. **É dev-only, não vai a produção.**

---

## 2. Mapa de épicos

| Épico | Título | Objetivo | Stories |
|---|---|---|---|
| **E1** | Fundação, Contrato & Camada de Dados | Ancorar o app no contrato da fundação (topologia, `/data/:table`, tenant, manifest) + isolar a camada de dados ("controllers") e definir a costura mock→gateway | 1.1 – 1.6 |
| **E2** | Schema & Migração Neon (§B4) | Traduzir as 7 entidades do brief numa migration que obedece §B4 à risca | 2.1 – 2.5 |
| **E3** | Autorização & Zero-Trust | O núcleo: nada sensível vem do front; autz 100% no gateway | 3.1 – 3.5 |
| **E4** | Extensões do Gateway | Só o que o genérico não cobre (Publicar, integridade de referências) | 4.1 – 4.3 |
| **E5** | Tratamento de Erros (importantíssimo) | Contrato de erro, status HTTP, observabilidade, integridade referencial | 5.1 – 5.5 |
| **E6** | Bloco de Validação (atômico) | Zero-trust granular: 1 regra de validação por story | 6.1 – 6.12 |
| **E7** | Ambiente Local (tenant-local via Docker) | Harness dev-only que reproduz o contrato do gateway p/ testar os fluxos localmente | 7.1 – 7.5 |

**Total: 41 stories.**

---

## 3. Como ler estas stories

- Toda story cita a fonte com caminho e seção: `[Source: Importantdoc.md#B4]`.
- "Backend" aqui = **gateway + schema Neon**. Nenhuma story pede servidor por-app (proibido, `Importantdoc.md §B3`).
- O bloco **E6** é propositalmente fragmentado (pedido do Erik: "separados por pontos e blocos") — cada regra de validação é rastreável isoladamente.
- `Status: ready-for-dev` significa "contexto completo para a equipe de backend consumir quando for integrar", não "código pronto".

## 4. Índice de arquivos

- E1: `1-1-modelo-mental-e-topologia.md`, `1-2-contrato-data-table.md`, `1-3-resolucao-tenant-client-protegido.md`, `1-4-manifest-papeis-better-auth.md`, `1-5-camada-dados-isolada-controllers.md`, `1-6-costura-mock-para-gateway.md`
- E2: `2-1-convencoes-schema-b4.md`, `2-2-tabelas-vault-pessoal.md`, `2-3-tabelas-referencias-favoritos.md`, `2-4-tabelas-base-compartilhada.md`, `2-5-types-gen-contrato-repos.md`
- E3: `3-1-owner-id-derivado-da-sessao.md`, `3-2-papel-server-side-ui-cosmetica.md`, `3-3-visibilidade-por-papel.md`, `3-4-idor-ownership-update-delete.md`, `3-5-gate-escrita-base-compartilhada.md`
- E4: `4-1-rota-publicar-base-compartilhada.md`, `4-2-integridade-referencias-cross-scope.md`, `4-3-limites-do-generico.md`
- E5: `5-1-envelope-de-erro-padrao.md`, `5-2-mapa-status-http.md`, `5-3-logging-correlation-id.md`, `5-4-integridade-referencial-cascade.md`, `5-5-traducao-erros-db-timeouts.md`
- E6: `6-1`…`6-12` (validação atômica)
- E7: `7-1-docker-compose-tenant-local.md`, `7-2-mock-gateway-vs-gateway-real.md`, `7-3-seed-tenant-better-auth-papeis.md`, `7-4-config-client-gateway-local.md`, `7-5-roteiro-teste-e2e-local.md`
