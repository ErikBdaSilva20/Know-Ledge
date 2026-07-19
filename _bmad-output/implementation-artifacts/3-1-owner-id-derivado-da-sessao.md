# Story 3.1: `owner_id` é derivado da sessão pelo gateway — nunca vem do front

Status: ready-for-dev

## Story

As a **responsável pela segurança do Knowledge Vault**,
I want **garantir que `owner_id` seja setado exclusivamente pelo gateway a partir da sessão**,
so that **um cliente malicioso não consiga criar/atribuir registros em nome de outro usuário**.

## Acceptance Criteria

1. Está documentado como invariante de segurança: **o front NUNCA envia `owner_id`**; o gateway o define a partir da sessão autenticada. [Source: Importantdoc.md#B5][Source: LOVEABLE-BRIEF.md#2.2]
2. Se o front enviar `owner_id` no corpo de `create`/`update`, o gateway **ignora ou rejeita** o valor (nunca confia) — comportamento esperado documentado e testado no tenant-local (E7). [Source: mentalidadeauditoria.md#5.6]
3. Os repos de `document`, `folder`, `document_reference`, `favorite` **não incluem `owner_id`** no payload de `create` (removido na costura, Story 1.6). [Source: Importantdoc.md#B5]
4. Está documentado que "todo registro tem um dono implícito (quem criou), mas o dono nunca é escolhido pela tela" — não existe campo de formulário "atribuir a". [Source: LOVEABLE-BRIEF.md#2.2]
5. A única exceção (atribuição explícita) é a **publicação para a base compartilhada**, e mesmo essa não seta `owner_id` (a tabela não tem) e usa `published_by` server-derived. [Source: LOVEABLE-BRIEF.md#2.2][Source: LOVEABLE-BRIEF.md#3]
6. Um caso de teste negativo confirma: request de rep tentando criar documento com `owner_id` de outro usuário → o registro fica com o `owner_id` da sessão do rep (nunca o injetado). [Source: mentalidadeauditoria.md#5.6]

## Tasks / Subtasks

- [ ] Task 1: Redigir o invariante "owner_id from session" (AC: #1, #4)
- [ ] Task 2: Especificar o comportamento do gateway ao receber `owner_id` do front (ignora/rejeita) (AC: #2) — linkar Story 6.2
- [ ] Task 3: Garantir que os repos não enviam `owner_id` (AC: #3)
- [ ] Task 4: Definir o caso de teste negativo para o tenant-local (AC: #6) — linkar Story 7.5

## Dev Notes

- Este é o coração do pedido de zero-trust: **nada sensível é confiado ao front para guardar/atribuir**. O `owner_id` é a fronteira entre "meus dados" e "dados de outro" — deixá-lo no controle do front seria IDOR de atribuição. [Source: mentalidadeauditoria.md#5.6]
- O gateway seta `owner_id` a partir da sessão (`Importantdoc §B5`: "owner_id é setado pelo gateway — NÃO mande do front").
- Relação com IDOR de leitura/escrita por id: Story 3.4.

### Project Structure Notes

- Este invariante é validado atomicamente na Story 6.2 (rejeição de owner_id do front) e testado na Story 7.5.

### References

- [Source: Importantdoc.md#B5] — owner_id setado pelo gateway
- [Source: LOVEABLE-BRIEF.md#2.2] — dono definido pela sessão, nunca pela tela
- [Source: mentalidadeauditoria.md#5.6] — IDOR / autorização por id

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
