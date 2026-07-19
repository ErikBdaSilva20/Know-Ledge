# Story 3.3: Visibilidade por papel aplicada pelo gateway (rep vê só o seu; manager/admin veem tudo)

Status: ready-for-dev

## Story

As a **responsável pela segurança**,
I want **a visibilidade de dados decidida pelo gateway conforme o papel, não pelo front**,
so that **um rep nunca receba dados de outro usuário mesmo que a tela pedisse a lista inteira**.

## Acceptance Criteria

1. Está documentado: no `GET /data/:table` de tabelas com `owner_id`, o gateway retorna **só as linhas do `owner_id` da sessão** para `rep`, e **todas as linhas** para `admin/manager/owner`. [Source: Importantdoc.md#B8]
2. O front **não filtra por segurança** — a filtragem de segurança é do gateway. O list-then-filter do front é só para busca/UX, sobre o que o gateway já autorizou. [Source: Importantdoc.md#B5][Source: LOVEABLE-BRIEF.md#2.2]
3. Para `manager/admin`, a árvore do Workspace inclui docs de todos os usuários **com indicação de dono** (avatar/nome) — dado que já vem do gateway. [Source: LOVEABLE-BRIEF.md#5.4]
4. `shared_document`/`shared_document_reference` são **legíveis por todos os logados** (comportamento lookup) — independem de papel para leitura. [Source: Importantdoc.md#B4][Source: LOVEABLE-BRIEF.md#5.5]
5. Um caso de teste confirma: `rep` chamando `list document` recebe **0 linhas de outros donos**; `manager` recebe as de todos. [Source: mentalidadeauditoria.md#5.6]
6. Está documentado que confiar no front para "esconder" dados de outro dono seria vazamento — a lista nunca deve conter dados não autorizados no payload. [Source: mentalidadeauditoria.md#5.2][Source: mentalidadeauditoria.md#5.6]

## Tasks / Subtasks

- [ ] Task 1: Documentar a matriz de visibilidade por tabela × papel (AC: #1, #4)
- [ ] Task 2: Esclarecer front-filter (UX) vs gateway-filter (segurança) (AC: #2, #6)
- [ ] Task 3: Especificar a indicação de dono no Workspace de manager/admin (AC: #3)
- [ ] Task 4: Definir casos de teste de visibilidade (AC: #5) — linkar Story 7.5

## Dev Notes

- Matriz-resumo:

| Tabela | rep (GET) | manager/admin (GET) | Escrita |
|---|---|---|---|
| `folder`, `document`, `document_reference`, `favorite` | só `owner_id` da sessão | todas | dono (rep) escreve as suas; manager/admin conforme gateway |
| `shared_document`, `shared_document_reference` | todas (lookup) | todas | só admin/manager |

[Source: Importantdoc.md#B8][Source: Importantdoc.md#B4]

- **Anti-vazamento (mentalidadeauditoria §5.2):** endpoint nunca deve retornar payload com dados que o usuário não pode ver "confiando que o front esconde". O gateway já corta na origem.
- Manager/Admin veem/editam todos os documentos; Admin adiciona gestão/visualização de usuários. [Source: LOVEABLE-BRIEF.md#4]

### Project Structure Notes

- Depende de 2.2/2.3/2.4 (schema) e 3.2 (papel server-side). Testado em 7.5.

### References

- [Source: Importantdoc.md#B8] — Visibilidade (admin/manager/owner veem tudo; rep só os próprios)
- [Source: Importantdoc.md#B4] — lookups legíveis a todos
- [Source: LOVEABLE-BRIEF.md#5.4] — Workspace de manager/admin com dono visível
- [Source: mentalidadeauditoria.md#5.2] — Network overhead / não vazar payload

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
