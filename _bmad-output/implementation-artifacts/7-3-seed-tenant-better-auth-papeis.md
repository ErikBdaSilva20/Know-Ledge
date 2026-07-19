# Story 7.3: Seed do tenant-local — Better-Auth, usuários e papéis

Status: ready-for-dev

## Story

As a **Erik testando os 3 papéis**,
I want **um seed que crie usuários admin/manager/rep e dados de exemplo no tenant-local**,
so that **eu alterne entre papéis e valide a visibilidade e o RBAC sem cadastrar tudo à mão**.

## Acceptance Criteria

1. O seed cria as tabelas do Better-Auth (via gateway) e semeia usuários de exemplo cobrindo **admin, manager e rep** — lembrando que o **1º usuário do tenant vira admin** automaticamente (Story 1.4). [Source: Importantdoc.md#B8]
2. O seed cria dados de exemplo por dono: pastas + documentos de **dois reps diferentes** (para testar visibilidade/IDOR cross-owner), mais alguns `shared_document`. [Source: LOVEABLE-BRIEF.md#4][Source: LOVEABLE-BRIEF.md#5.4]
3. O seed cria referências e favoritos de exemplo para exercitar grafo/backlinks e o gate ownerless. [Source: LOVEABLE-BRIEF.md#3]
4. Credenciais de seed ficam em `.env`/script local, **sem segredos comitados**. [Source: mentalidadeauditoria.md#5.6]
5. O seed é **idempotente** (rodar de novo não duplica) — útil para reset do ambiente. [Source: mentalidadeauditoria.md#5.5]
6. Está documentado como resetar o tenant-local (drop volume/reseed) para um estado limpo de teste.

## Tasks / Subtasks

- [ ] Task 1: Definir o seed de usuários/papéis (admin/manager/2×rep) (AC: #1)
- [ ] Task 2: Definir dados de exemplo por dono + shared (AC: #2, #3)
- [ ] Task 3: Definir credenciais via env sem segredo comitado (AC: #4)
- [ ] Task 4: Tornar o seed idempotente + documentar reset (AC: #5, #6)

## Dev Notes

- Ter **dois reps** no seed é o que permite testar o coração do zero-trust: rep A não vê/edita dados de rep B (Stories 3.3/3.4), e manager/admin veem tudo (3.3). [Source: LOVEABLE-BRIEF.md#4][Source: mentalidadeauditoria.md#5.6]
- O "1º user = admin" é automático na fundação; o seed deve respeitar essa ordem ao criar. [Source: Importantdoc.md#B8]
- No produto real não há CRUD de usuário (é do Better-Auth) — o seed simula o cadastro que o gateway faria. [Source: LOVEABLE-BRIEF.md#5.9]

### Project Structure Notes

- `dev/seed/` (script + fixtures). Dev-only, fora do bundle de produção.

### References

- [Source: Importantdoc.md#B8] — papéis, 1º user = admin
- [Source: LOVEABLE-BRIEF.md#4] — papéis e visibilidade
- [Source: LOVEABLE-BRIEF.md#3] — entidades para semear

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
