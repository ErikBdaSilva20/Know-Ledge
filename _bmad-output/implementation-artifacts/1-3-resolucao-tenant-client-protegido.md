---
baseline_commit: 6de259e96aa22e09d3e6abdf7c005d4f5eebf364
---

# Story 1.3: Resolução de tenant e o `client.ts` protegido (contrato de sessão)

Status: done

## Story

As a **engenheiro integrando a autenticação e o roteamento multi-tenant**,
I want **entender como o tenant é resolvido em runtime e por que `client.ts`/`types.gen.ts` são intocáveis**,
so that **a costura front↔gateway não quebre o roteamento de tenant nem o contrato de sessão**.

## Acceptance Criteria

1. Está documentado que o `client.ts` resolve config de config na ordem: `?gw=&t=` **ou** `import.meta.env.VITE_*` **ou** globais de runtime `window.__MASI_GW__` / `window.__MASI_TENANT__` (injetados pelo edge worker em prod). [Source: Importantdoc.md#B5]
2. Está documentado que toda request vai com **`credentials: 'include'`** e header **`X-Tenant-Id`**. [Source: Importantdoc.md#B5]
3. Está documentado o **branch de PREVIEW** (`window.__MASI_PREVIEW__`) com fixtures usado pelo editor Sandpack — e que ele é separado do fluxo real. [Source: Importantdoc.md#B5]
4. Está registrado que `client.ts` e `types.gen.ts` são **PROTEGIDOS** (contrato com o gateway) e **não podem ser editados pela IA nem à mão** durante a costura. [Source: Importantdoc.md#B7][Source: Importantdoc.md#B11]
5. Está documentado que o **tenant é injetado em runtime** (build compartilhado): o edge worker injeta `window.__MASI_TENANT__` no `index.html` do R2 e o app lê e manda no `X-Tenant-Id`. [Source: Importantdoc.md#B10]
6. Fica claro que a segurança do tenant é do gateway: mesmo que o front mande `X-Tenant-Id`, o gateway valida contra a sessão (aprofundado na Story 6.9).

## Tasks / Subtasks

- [x] Task 1: Documentar a cadeia de resolução de config do `client.ts` (AC: #1, #2, #5)
  - [x] Subtask 1.1: Ordem de precedência `?gw=&t=` → `VITE_*` → globais de runtime
  - [x] Subtask 1.2: `credentials: 'include'` + `X-Tenant-Id`
- [x] Task 2: Documentar o branch PREVIEW e sua separação do fluxo real (AC: #3)
- [x] Task 3: Marcar `client.ts`/`types.gen.ts` como protegidos e explicar o porquê (AC: #4)
- [x] Task 4: Nota de segurança: `X-Tenant-Id` é validado no gateway (AC: #6) — linkar Story 6.9

## Dev Notes

- **Não reescrever `client.ts` à mão** — herda-se copiando o scaffold. Reescrever quebra o link com o gateway. [Source: Importantdoc.md#B5][Source: Importantdoc.md#B11]
- No scaffold `wiki` (shadcn), além de `client.ts`/`types.gen.ts`, também são protegidos `src/components/ui/**`, `src/lib/utils.ts`, `vite.config.ts`, `components.json`, `preview-fixtures.ts`. O Knowledge Vault usa Tailwind v4 + shadcn (Atelier). [Source: Importantdoc.md#B7][Source: LOVEABLE-BRIEF.md#2.1]
- `envContract` sempre `["VITE_GATEWAY_URL"]`. [Source: Importantdoc.md#B7]

### Project Structure Notes

- Protegidos: `src/lib/data/client.ts`, `src/lib/data/types.gen.ts`, `src/components/registry.tsx`, `src/main.tsx`, `supabase/migrations/**`, e (no scaffold wiki) `src/components/ui/**`, `src/lib/utils.ts`, `vite.config.ts`, `components.json`, `preview-fixtures.ts`.
- Editáveis: telas, componentes, `*.repo.ts`, `format.ts`, CSS.

### References

- [Source: Importantdoc.md#B5] — client.ts real (resolução de config, credentials, X-Tenant-Id, preview)
- [Source: Importantdoc.md#B7] — Manifest, allow/protect, envContract
- [Source: Importantdoc.md#B10] — Build compartilhado, tenant em runtime
- [Source: Importantdoc.md#B11] — Edição por IA e arquivos protegidos

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- Implementado `knowledge/src/lib/data/client.ts` (PROTEGIDO): `resolveConfig()` resolve `gatewayUrl`/`tenantId` na ordem `?gw=&t=` → `import.meta.env.VITE_*` → `window.__MASI_GW__`/`__MASI_TENANT__`; `api()` sempre manda `credentials: 'include'` + header `X-Tenant-Id`.
- Branch de PREVIEW: `isPreview()` lê `window.__MASI_PREVIEW__`; em preview, `db.table(name).list()` retorna fixtures de `window.__MASI_PREVIEW_FIXTURES__[name]` em vez de bater no gateway; `auth.me()` retorna sessão vazia. Separado do fluxo real (nunca chama `fetch`).
- `auth.me()/signIn/signUp/signOut` implementados contra a superfície REST padrão do Better-Auth (`/api/auth/get-session`, `/sign-in/email`, `/sign-up/email`, `/sign-out`) — **precisa ser confirmado contra a config real do gateway quando o Epic 3 ligar auth de verdade**; hoje nada no app chama esses métodos ainda (isso é da Story 1.6/Epic 3).
- `types.gen.ts` criado (PROTEGIDO, gerado a partir do schema de `doc/architecture/01-stack-e-modelagem.md` §3 — regenerar quando as migrations reais do Epic 2 existirem).
- `client.ts`/`types.gen.ts`/`dataSource.ts` listados como `protect` em `knowledge/masi.template.json` (Story 1.4).
- Nota de segurança (AC#6): `X-Tenant-Id` é só um hint do client — a validação real (tenant bate com a sessão) é responsabilidade do gateway, aprofundada na Story 6.9 (ainda não implementada, é backend fora deste repo).
- `window.__MASI_GW__`/`__MASI_TENANT__`/`__MASI_PREVIEW__`/`__MASI_PREVIEW_FIXTURES__` e `import.meta.env.VITE_*` tipados em `knowledge/src/vite-env.d.ts` (evita `as any` no client).

### File List

- `knowledge/src/lib/data/client.ts` (novo, protegido)
- `knowledge/src/lib/data/types.gen.ts` (novo, protegido)
- `knowledge/src/vite-env.d.ts` (novo)
- `knowledge/.env.example` (novo)
