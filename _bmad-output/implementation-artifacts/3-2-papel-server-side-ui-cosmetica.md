---
baseline_commit: 0e6e968
---

# Story 3.2: Papel é resolvido no servidor — `role` no front é só cosmético

Status: done

## Story

As a **responsável pela segurança**,
I want **que o papel (rep/manager/admin) seja aplicado pelo gateway, e o `role` do front sirva só para esconder botões**,
so that **trocar o papel no cliente não conceda nenhuma permissão real**.

## Acceptance Criteria

1. Está documentado o invariante: **`role` no front é UI-only** (esconder/mostrar botões); a **segurança real é no gateway**. [Source: Importantdoc.md#B8]
2. `src/lib/auth.tsx` obtém `{ user, role }` de `auth.me()` (do gateway) — o front não "escolhe" papel. O seletor de papel do mock é removido na costura (Story 1.6). [Source: Importantdoc.md#B8][Source: LOVEABLE-BRIEF.md#4]
3. Está documentado que **manipular `role` no cliente não muda nada**: se um rep forjar `role='admin'` no estado do front, o gateway ainda aplica as permissões de rep (a visibilidade e a escrita são decididas server-side). [Source: mentalidadeauditoria.md#5.6]
4. Todos os controles de UI sensíveis (botão "Publicar", editar base compartilhada, tela Admin) são **gated também no servidor**, não só escondidos. [Source: LOVEABLE-BRIEF.md#5.9][Source: Importantdoc.md#B8]
5. Um caso de teste confirma: rep com `role` forjado tentando editar `shared_document` → **403 do gateway** (Story 3.5), independentemente do que a UI mostra.
6. A tela Admin (`admin`/`manager`) só aparece por conveniência; nenhuma operação dela contorna o gateway. [Source: LOVEABLE-BRIEF.md#5.1][Source: LOVEABLE-BRIEF.md#5.9]

## Tasks / Subtasks

- [x] Task 1: Redigir o invariante "role é cosmético" (AC: #1, #3)
- [x] Task 2: Mapear `auth.me()` → `{ user, role }` e a remoção do seletor mock (AC: #2)
- [x] Task 3: Listar todos os controles gated na UI e confirmar o gate server-side correspondente (AC: #4, #6)
- [x] Task 4: Definir caso de teste de papel forjado (AC: #5) — linkar Story 7.5

## Dev Notes

- Regra do doc: "Use `role` **só pra UI** (esconder botões); a segurança real é no gateway." [Source: Importantdoc.md#B8]
- Princípio de auditoria: autenticação/autorização verificadas em **todo** boundary de API; não confiar em flag de cliente. [Source: mentalidadeauditoria.md#5.6]
- Papéis: **admin/manager/owner veem tudo; rep vê só os próprios** (`owner_id`). Lookups (base compartilhada): leitura a todos, escrita admin/manager. [Source: Importantdoc.md#B8] — aprofundado em 3.3 e 3.5.

### Project Structure Notes

- `auth.tsx` é editável, mas o contrato de sessão vem de `client.ts` (protegido). O gate de UI usa `role`; o gate real é do gateway.

### References

- [Source: Importantdoc.md#B8] — role só pra UI; segurança no gateway
- [Source: LOVEABLE-BRIEF.md#4] — Papéis
- [Source: mentalidadeauditoria.md#5.6] — Auth verificada em todo boundary

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- **Decisão registrada:** este repo não tem `src/lib/auth.tsx` separado como o exemplo genérico da fundação sugere — `knowledge/src/lib/session.tsx` já cumpre esse papel (hidrata `{user,role}` via `auth.me()` em modo gateway, entregue na Story 1.6). Criar um `auth.tsx` paralelo duplicaria a fonte de sessão; documentado em `03-seguranca-zero-trust.md §2` para não ser "recriado" por engano depois.
- Auditoria de todos os `can(...)` no código (`AdminPage`, `RoleSwitcher`, botão Publicar em `workspace-doc.tsx`/`shared.tsx`, editar/remover em `Editor.tsx`/`admin.tsx`): **nenhum** é consultado para decidir se uma chamada de rede "deveria" funcionar — todos só condicionam renderização/redirect. A chamada de rede sempre é disparada e é o gateway quem aceita/nega (AC#3, #4, #6).
- Caso de teste de papel forjado (AC#5) especificado em `03-seguranca-zero-trust.md §2` e no checklist §6 — não executado nesta sessão (sem gateway local).

### File List

- `doc/architecture/03-seguranca-zero-trust.md` (§2)
