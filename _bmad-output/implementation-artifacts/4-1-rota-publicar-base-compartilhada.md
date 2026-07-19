# Story 4.1: Extensão do gateway — rota de "Publicar na Base Compartilhada"

Status: ready-for-dev

## Story

As a **manager/admin curando conhecimento**,
I want **uma rota server-side que publique um documento pessoal como `shared_document` independente**,
so that **o `published_by` venha da sessão e a cópia seja atômica e autorizada, sem confiar no front**.

## Acceptance Criteria

1. Está documentado **por que Publicar é uma extensão** e não cabe no `/data/:table` genérico: ela (a) lê um `document` (potencialmente de outro dono — cross-owner), (b) cria um `shared_document` **novo e independente**, (c) seta `published_by` a partir da sessão, (d) copia `title`/`content` e grava `source_document_id` (rastreabilidade). [Source: Importantdoc.md#B6][Source: LOVEABLE-BRIEF.md#6]
2. A rota é **gated a manager/admin** no servidor (rep recebe 403), coerente com Story 3.5. [Source: LOVEABLE-BRIEF.md#5.5]
3. A cópia é **independente**: editar depois o `document` ou o `shared_document` não afeta o outro. [Source: LOVEABLE-BRIEF.md#6]
4. `published_by` e `id`/`created_at`/`updated_at` são **server-generated**; o front só envia o `source_document_id` (qual doc publicar). [Source: Importantdoc.md#B5]
5. A rota é definida como pertencente ao **gateway** (`tenant-gateway`), fora do repo do app — precisa de alinhamento com o dono do gateway (não se resolve no template). [Source: Importantdoc.md#B6]
6. Erros são tratados no contrato padrão (Story 5.1/5.2): doc-fonte inexistente → 404; sem permissão → 403; corpo inválido → 400.
7. **Alternativa avaliada e registrada:** fazer no front via 2 chamadas (`list document` + `create shared_document`) — **rejeitada** porque `published_by` server-side e o gate cross-owner exigem servidor; e um rep não pode escrever em `shared_document` de qualquer forma.

## Tasks / Subtasks

- [ ] Task 1: Especificar o contrato da rota `POST /shared/publish` (entrada: `source_document_id`; saída: `shared_document`) (AC: #1, #4)
- [ ] Task 2: Definir o gate de papel e o comportamento cross-owner (manager publica doc de rep) (AC: #2)
- [ ] Task 3: Definir a semântica de cópia independente e a rastreabilidade `source_document_id` (AC: #3)
- [ ] Task 4: Mapear erros da rota ao contrato padrão (AC: #6) — linkar Story 5.2
- [ ] Task 5: Registrar a análise da alternativa 2-queries e por que foi rejeitada (AC: #7)
- [ ] Task 6: Marcar como item de alinhamento com o dono do gateway (AC: #5)

## Dev Notes

- O `/data/:table` **exige sessão** e, para tabela ownerless, escrita só admin/manager — publicar precisa de lógica de cópia + `published_by`, então é rota explícita, como as rotas públicas de LinkHub/Forms citadas no doc. [Source: Importantdoc.md#B6]
- Fluxo de produto: abrir doc (seu ou de um rep) → botão "Publicar" → confirma → aparece na base como cópia independente. [Source: LOVEABLE-BRIEF.md#6][Source: LOVEABLE-BRIEF.md#5.4]
- **Idempotência:** considerar chave de idempotência para evitar publicação duplicada em duplo-clique (Story 6.11). [Source: mentalidadeauditoria.md#5.5]

### Project Structure Notes

- Extensão vive em `tenant-gateway/src/routes/` (repo separado). No app, o `sharedDocuments.repo.ts` ganha um verbo `publish(sourceDocumentId)` que chama essa rota.

### References

- [Source: Importantdoc.md#B6] — Extensões: rotas explícitas no gateway
- [Source: LOVEABLE-BRIEF.md#6] — Fluxo Publicar (cópia independente)
- [Source: LOVEABLE-BRIEF.md#5.5] — só manager/admin publicam

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
