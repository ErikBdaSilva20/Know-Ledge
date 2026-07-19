# Story 1.3: Resolução de tenant e o `client.ts` protegido (contrato de sessão)

Status: ready-for-dev

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

- [ ] Task 1: Documentar a cadeia de resolução de config do `client.ts` (AC: #1, #2, #5)
  - [ ] Subtask 1.1: Ordem de precedência `?gw=&t=` → `VITE_*` → globais de runtime
  - [ ] Subtask 1.2: `credentials: 'include'` + `X-Tenant-Id`
- [ ] Task 2: Documentar o branch PREVIEW e sua separação do fluxo real (AC: #3)
- [ ] Task 3: Marcar `client.ts`/`types.gen.ts` como protegidos e explicar o porquê (AC: #4)
- [ ] Task 4: Nota de segurança: `X-Tenant-Id` é validado no gateway (AC: #6) — linkar Story 6.9

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

### Debug Log References

### Completion Notes List

### File List
