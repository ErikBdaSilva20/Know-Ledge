---
baseline_commit: 0e6e968
---

# Story 3.5: Gate de escrita na Base Compartilhada (tabela sem owner = só admin/manager)

Status: done

## Story

As a **responsável pela segurança**,
I want **que toda escrita em `shared_document`/`shared_document_reference` seja permitida só a admin/manager pelo gateway**,
so that **um rep nunca publique, edite ou remova conteúdo da base compartilhada, mesmo forjando a UI**.

## Acceptance Criteria

1. Está documentado que, por serem tabelas **sem `owner_id`**, o gateway aplica: leitura a todo logado; **`POST`/`PATCH`/`DELETE` só admin/manager** → rep recebe **403**. [Source: Importantdoc.md#B4.1][Source: Importantdoc.md#B4 (item 6)]
2. A regra de produto é mapeada 1:1: **Rep** só lê a base compartilhada; **Manager/Admin** publicam, editam e removem, e criam referências entre documentos compartilhados. [Source: LOVEABLE-BRIEF.md#5.5]
3. O botão "Publicar" e as ações de editar/remover da base compartilhada aparecem só para manager/admin **e** são gated no servidor (Story 3.2). [Source: LOVEABLE-BRIEF.md#5.4][Source: LOVEABLE-BRIEF.md#5.5]
4. Um caso de teste confirma: `rep` tentando `POST shared_document` ou `PATCH shared_document/{id}` → **403**, sem efeito. [Source: mentalidadeauditoria.md#5.6]
5. Está documentado que isto **não exige código de autorização novo** — é o comportamento automático do gateway para tabelas ownerless (o achado crítico do épico). [Source: Importantdoc.md#B4.1]
6. A operação de **publicar** (que cria um `shared_document`) é uma extensão à parte (Story 4.1) porque envolve copiar um `document` e setar `published_by` server-side, além do gate de papel.

## Tasks / Subtasks

- [x] Task 1: Redigir o gate de escrita ownerless → admin/manager (AC: #1, #5)
- [x] Task 2: Mapear a regra de produto para o comportamento do gateway (AC: #2, #3)
- [x] Task 3: Casos de teste de escrita negada para rep (AC: #4) — linkar Story 7.5
- [x] Task 4: Delimitar o que é gate automático (esta story) vs a rota Publicar (Story 4.1) (AC: #6)

## Dev Notes

- Este é o pagamento do achado do épico: a ausência de `owner_id` em `shared_document` **é** o mecanismo de autorização. Não há middleware custom — o gateway já recusa. [Source: Importantdoc.md#B4.1]
- Editar/remover diretamente na base compartilhada (manager/admin) usa o `/data/shared_document` genérico. **Publicar** (copiar de um doc pessoal) usa a rota da Story 4.1. [Source: LOVEABLE-BRIEF.md#5.5][Source: LOVEABLE-BRIEF.md#6]
- Confirmação de exclusão na base compartilhada é UX; o gate real é server-side. [Source: LOVEABLE-BRIEF.md#7]

### Project Structure Notes

- Depende de 2.4 (tabelas ownerless) e 3.2 (papel server-side). A rota Publicar (4.1) reusa este gate.

### References

- [Source: Importantdoc.md#B4.1] — gateway recusa escrita sem owner_id de não-admin/manager
- [Source: Importantdoc.md#B4] — item 6 (lookups: escrita só admin/manager)
- [Source: LOVEABLE-BRIEF.md#5.5] — Base compartilhada (rep lê; manager/admin editam)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- Gate ownerless documentado (AC#1, #5) reaproveitando o achado já registrado em `doc/architecture/01-stack-e-modelagem.md §5.1` — não é código novo, é o comportamento padrão do gateway pra qualquer tabela sem `owner_id` (`shared_documents`/`shared_document_references`, Story 2.4).
- Auditoria: botão Publicar (`workspace-doc.tsx`, `shared.tsx`) e editar/remover na base compartilhada (`Editor.tsx`, `admin.tsx`, `shared-doc.tsx`) só **renderizam** condicionados a `can("publishShared"/"editShared")` — a chamada de rede em si não checa papel localmente (AC#2, #3).
- **Delimitação (AC#6):** esta story cobre só o gate automático de escrita direta em `shared_documents` via `/data/shared_documents`. A operação de **Publicar** (copiar um `document` pessoal pra `shared_documents`, setando `published_by` a partir da sessão) é a Story 4.1 — ainda não implementada, é a próxima do Épico 4.
- Caso de teste de escrita negada pra rep (AC#4) especificado em `03-seguranca-zero-trust.md §5`/§6 — não executado (sem gateway local).

### File List

- `doc/architecture/03-seguranca-zero-trust.md` (§5, §6)
