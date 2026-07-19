# Story 1.1: Modelo mental e topologia do backend (fundação MasIA)

Status: ready-for-dev

## Story

As a **engenheiro de backend integrando o Knowledge Vault**,
I want **entender e documentar a topologia exata da fundação (SPA → tenant-gateway → Neon) e o que é/ não é responsabilidade deste app**,
so that **ninguém escreva um servidor por-app proibido nem acesse o banco direto, e a integração futura seja só trocar a camada de dados**.

## Acceptance Criteria

1. **Dado** que o app hoje é 100% frontend com mock, **quando** documentamos a topologia-alvo, **então** ela descreve literalmente: `[SPA Vite/React] --HTTPS--> [tenant-gateway compartilhado] --SQL--> [Neon do tenant]`, com o gateway resolvendo o tenant por hostname/header. [Source: Importantdoc.md#B1]
2. O documento afirma explicitamente que **não existe backend por-app**: nada de Express/Nest/Next/servidor próprio, nada de acesso direto ao banco, nada de Supabase/Firebase. [Source: Importantdoc.md#B3]
3. O documento afirma que **a autorização é no gateway (app-layer), sem RLS, sem `auth.uid()`** — o banco Neon guarda só o schema. [Source: Importantdoc.md#B1]
4. Estão listadas as **3 superfícies de trabalho** por-app e somente elas: (a) schema/migration no Neon, (b) camada de dados do app falando com o gateway, (c) eventuais extensões explícitas do gateway (ex.: Publicar).
5. Está registrado que dados ficam **fisicamente isolados** (1 Neon por cliente) e que o app **só fala com o gateway** via `db`/`auth`.
6. Um diagrama (mermaid) da topologia é incluído e revisado.

## Tasks / Subtasks

- [ ] Task 1: Escrever a seção "Topologia-alvo" no doc de arquitetura do backend (AC: #1, #6)
  - [ ] Subtask 1.1: Diagrama mermaid SPA → gateway → Neon com resolução de tenant
  - [ ] Subtask 1.2: Tabela "onde tudo mora" (templates, edge-worker, gateway, migrations) [Source: Importantdoc.md#B2]
- [ ] Task 2: Escrever a seção "Proibições duras" (AC: #2, #3)
  - [ ] Subtask 2.1: Lista negativa (sem backend próprio, sem BaaS, sem RLS, sem acesso direto ao banco)
- [ ] Task 3: Escrever a seção "As 3 superfícies deste app" (AC: #4, #5)
- [ ] Task 4: Revisão cruzada com `Importantdoc.md` §B1–§B3 garantindo zero contradição

## Dev Notes

- Este app é o **Knowledge Vault**: base de conhecimento Markdown (vault pessoal + base compartilhada). Ver produto em `LOVEABLE-BRIEF.md §1`.
- O backend real já existe: `tenant-gateway` (Hono), repo separado `Cerebra-AI/tenant-gateway`, deploy Fly. Este projeto **não** contém o gateway. [Source: Importantdoc.md#B2]
- Consequência prática para todas as telas: o app lê/escreve **só** via `db`/`auth` expostos por `src/lib/data/client.ts`. Nunca `@supabase`, fetch cru pro banco, ou driver SQL no browser. [Source: Importantdoc.md#B3]

### Project Structure Notes

- Alinha com o modelo mental do scaffold `vite-react-gateway`. Nenhuma pasta de servidor deve existir no repo do app.
- Conecta com Story 1.5 (camada de dados isolada) e 1.6 (costura mock→gateway).

### References

- [Source: Importantdoc.md#B1] — Modelo mental (decore)
- [Source: Importantdoc.md#B2] — Onde tudo mora
- [Source: Importantdoc.md#B3] — Tecnologias e proibições
- [Source: LOVEABLE-BRIEF.md#1] — O que é o produto

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
