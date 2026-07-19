# Story 1.6: Costura mock → gateway (a troca sem redesenhar telas)

Status: ready-for-dev

## Story

As a **engenheiro reconectando o Knowledge Vault ao backend real**,
I want **um plano de troca da implementação dos repos (mock → `db.table`) sem alterar telas**,
so that **a promessa do brief se cumpra: "só trocar a implementação dos repositórios"**.

## Acceptance Criteria

1. Está definido que **a interface pública dos repos não muda** entre mock e real — só a implementação interna. As telas continuam chamando `listDocuments()`, etc. [Source: LOVEABLE-BRIEF.md#2.2][Source: LOVEABLE-BRIEF.md#9]
2. Está mapeado, entidade por entidade, o alvo real: `documents` → `db.table('document')`, `folders` → `db.table('folder')`, `sharedDocuments` → `db.table('shared_document')`, `references` → `db.table('document_reference')` + `db.table('shared_document_reference')`, `favorites` → `db.table('favorite')`.
3. Está documentado que **campos derivados pela sessão deixam de ser enviados** na troca: `owner_id`, `published_by` param de vir do mock/form e passam a ser setados pelo gateway. (Story 3.1, 3.5)
4. O **seletor de papel mock** (`LOVEABLE-BRIEF §4`) é substituído por `auth.me()`; `auth.signIn/signUp/signOut` substituem o "login mock". [Source: Importantdoc.md#B8]
5. Está definida uma **estratégia de flag** (ex.: `VITE_DATA_SOURCE=mock|gateway`) que permite alternar as implementações sem tocar na UI, útil para o tenant-local (E7).
6. Uma checklist de regressão confirma que cada tela do brief (§5) funciona idêntica após a troca, incluindo estados vazios e confirmações de exclusão.

## Tasks / Subtasks

- [ ] Task 1: Definir a interface estável dos repos (contrato imutável UI-facing) (AC: #1)
- [ ] Task 2: Tabela de mapeamento repo → `db.table('<snake_case>')` (AC: #2)
- [ ] Task 3: Listar campos que somem na troca (setados pelo gateway) (AC: #3)
  - [ ] Subtask 3.1: `owner_id` (folder, document, document_reference, favorite)
  - [ ] Subtask 3.2: `published_by` (shared_document — via rota Publicar, Story 4.1)
  - [ ] Subtask 3.3: `id`, `created_at`, `updated_at` (sempre server-generated)
- [ ] Task 4: Substituir auth mock por Better-Auth (`auth.me`, signIn/up/out) (AC: #4)
- [ ] Task 5: Definir a flag `VITE_DATA_SOURCE` e como o E7 a usa (AC: #5)
- [ ] Task 6: Checklist de regressão por tela (AC: #6)

## Dev Notes

- Entrega esperada do produto: "pronto para depois substituirmos a camada de dados mockada pela integração com o backend real — sem precisar redesenhar telas". Esta story é o roteiro dessa substituição. [Source: LOVEABLE-BRIEF.md#9]
- **Cuidado de nomenclatura:** os repos podem usar nomes em inglês/camelCase, mas as **tabelas e colunas são snake_case** (o backend devolve assim). O mapeamento de nomes fica no repo, não na UI. [Source: LOVEABLE-BRIEF.md#3][Source: Importantdoc.md#B4]
- **Exclusão é permanente e imediata** (sem lixeira). A confirmação é UX; o `remove()` do repo chama `DELETE /data/:table/:id`. [Source: LOVEABLE-BRIEF.md#2.3][Source: LOVEABLE-BRIEF.md#6]

### Project Structure Notes

- Depende de Story 1.5 (camada isolada) e das Stories de E2 (schema real). Habilita E7 (tenant-local) via a flag `VITE_DATA_SOURCE`.

### References

- [Source: LOVEABLE-BRIEF.md#2.2] — Estruture o acesso a dados como se já fosse a API real
- [Source: LOVEABLE-BRIEF.md#9] — Entrega esperada (trocar só os repositórios)
- [Source: Importantdoc.md#B5] — db.table e limites
- [Source: Importantdoc.md#B8] — Better-Auth

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
