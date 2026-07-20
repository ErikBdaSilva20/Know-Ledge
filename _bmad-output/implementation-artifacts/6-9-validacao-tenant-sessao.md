---
baseline_commit: 6cba9cb
---

# Story 6.9: [VALIDAÇÃO] `X-Tenant-Id` deve casar com a sessão (isolamento de tenant)

Status: review

## Story

As a **responsável pelo isolamento multi-tenant**,
I want **que o gateway valide o `X-Tenant-Id` contra a sessão autenticada**,
so that **um cliente não acesse dados de outro tenant trocando o header**.

## Acceptance Criteria

1. Toda request autenticada carrega `X-Tenant-Id` (Story 1.3); o gateway **valida** que o tenant do header corresponde ao tenant da sessão — divergência → **401/403**. [Source: Importantdoc.md#B5][Source: mentalidadeauditoria.md#5.6]
2. Está documentado que o `X-Tenant-Id` **vindo do front não é confiável por si** — é a sessão (Better-Auth) que fixa o tenant; o header apenas roteia. [Source: Importantdoc.md#B10][Source: mentalidadeauditoria.md#5.6]
3. O isolamento físico (1 Neon por tenant) é a última linha: mesmo com header adulterado, a sessão não dá acesso ao banco de outro tenant. [Source: Importantdoc.md#B1]
4. Um caso de teste confirma: sessão do tenant A + `X-Tenant-Id: B` → negado, sem dados de B. [Source: mentalidadeauditoria.md#5.6]
5. Está registrado que isto é comportamento do **gateway**; o app só injeta o header como o edge worker mandou em runtime (Story 1.3). [Source: Importantdoc.md#B10]
6. No tenant-local (E7), o teste de tenant cruzado é reproduzível. [Source: Importantdoc.md#B1]

## Tasks / Subtasks

- [x] Task 1: Documentar a validação header↔sessão (AC: #1, #2)
- [x] Task 2: Registrar a defesa em profundidade (sessão + banco isolado) (AC: #3)
- [x] Task 3: Caso de teste de tenant cruzado (AC: #4, #6) — linkar Story 7.5

## Dev Notes

- Multi-tenant: o `X-Tenant-Id` roteia, mas a **autoridade é a sessão**. Confiar só no header seria cross-tenant IDOR. [Source: mentalidadeauditoria.md#5.6]
- O edge worker injeta `window.__MASI_TENANT__` em runtime; o app repassa no header. A validação é do gateway. [Source: Importantdoc.md#B10][Source: Importantdoc.md#B5]
- Isolamento físico (Neon por tenant) reduz o blast radius de qualquer falha de autz. [Source: Importantdoc.md#B1]

### Project Structure Notes

- Server-side (gateway). O app só injeta o header (client.ts protegido, Story 1.3).

### References

- [Source: Importantdoc.md#B5] — X-Tenant-Id
- [Source: Importantdoc.md#B10] — tenant em runtime
- [Source: Importantdoc.md#B1] — isolamento físico por tenant
- [Source: mentalidadeauditoria.md#5.6] — cross-tenant / autorização

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

- Não executado contra Postgres real. Status `review`. Nada novo implementado — esta story só formaliza/documenta comportamento já existente desde a Story 7.2.

### Completion Notes List

- `requireTenant` (`knowledge/dev/mock-gateway/src/middleware.ts`, entregue na Story 7.2) já valida `X-Tenant-Id` contra `TENANT_ID` configurado — divergência → 403 (AC#1). No harness local (single-tenant), "a sessão" e "o tenant configurado" são a mesma coisa; num gateway multi-tenant real, a validação seria contra o tenant da sessão, não uma env var fixa — mesma ideia, granularidade diferente porque este é um harness single-tenant.
- Documentado (AC#2, #3): `X-Tenant-Id` só roteia, não autoriza; o isolamento físico (1 Neon por tenant) é a última linha mesmo se o header for adulterado.
- Caso de teste (AC#4, #6) já existia em `dev/e2e/roteiro.sh` desde o Épico 4: "X-Tenant-Id errado -> 403".

### File List

- (nenhum arquivo novo — comportamento já implementado na Story 7.2, só formalizado aqui)
