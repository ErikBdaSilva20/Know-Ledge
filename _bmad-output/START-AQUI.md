# 🧭 START AQUI — Backend do Knowledge Vault (arquivo de controle)

> **Este é o ÚNICO arquivo que você precisa abrir primeiro.** Ele diz por onde começar, onde
> paramos, e a regra obrigatória de marcar progresso. Toda IA/dev que pegar este projeto começa
> **por aqui**.

---

## 0. Missão (em uma frase)

Conectar o Knowledge Vault (hoje 100% frontend com mock) ao **backend da fundação MasIA** —
o `tenant-gateway` compartilhado + Neon + Better-Auth —, definindo **schema, autorização
(zero-trust), tratamento de erros e validação**. **NÃO** se constrói servidor próprio.

---

## 1. ⛳ Por onde começar / onde paramos

A **ÚNICA fonte-da-verdade do progresso** é o arquivo
**`implementation-artifacts/sprint-status.yaml`**. Sempre consulte-o para saber o estado.

**Para achar a próxima tarefa:**
1. Abra `implementation-artifacts/sprint-status.yaml`.
2. Ache a **primeira story de cima para baixo** cujo status **não** seja `done`, seguindo a
   **ordem recomendada (Seção 4)**.
3. Abra o arquivo dela em `implementation-artifacts/<arquivo>.md` e execute.

> Estado em 2026-07-22: Épicos 1-4 `done`. Épicos 5 e 7 implementados e em `review`
> (código pronto — envelope de erro, status map, logging, cascade, timeout/retry/
> idempotência — verificação em runtime pendente, rodar na máquina do Erik: Docker
> Desktop não estava acessível no ambiente onde isto foi construído). Próxima:
> **Épico 6** (Bloco de Validação), começando pela Story 6.1
> (`implementation-artifacts/6-1-validacao-schema-no-boundary.md`).

---

## 2. 🔴 REGRA DE OURO — marcar SEMPRE como concluído (obrigatório)

> **Toda vez que terminar qualquer parte, você DEVE registrar a conclusão. Não pule isto.**
> Sem esse registro, ninguém sabe onde paramos e o trabalho se perde.

Ao concluir uma **story**, atualize os **3 lugares** abaixo (todos, na mesma passada):

1. **No `sprint-status.yaml`** (a fonte-da-verdade): mude a chave da story para `done`. Quando a
   **primeira** story de um épico começa, mude `epic-N: backlog → in-progress`; quando a
   **última** do épico termina, `epic-N: in-progress → done`. Atualize também `last_updated`.
2. **No topo da story** (`implementation-artifacts/<arquivo>.md`): mude
   `Status: ready-for-dev` → `Status: done`. (Use `in-progress` enquanto estiver trabalhando nela.)
3. **Nos checkboxes da story**: marque cada `- [ ]` como `- [x]` em *Tasks / Subtasks* conforme
   for fazendo.

Além disso, na story concluída, preencha no *Dev Agent Record*:
- **Completion Notes List** — o que foi feito e decisões tomadas.
- **File List** — todos os arquivos criados/alterados.

### ✅ Definition of Done (uma story só está `done` quando)
- Todos os Acceptance Criteria atendidos e os checkboxes marcados.
- Os 3 lugares acima atualizados (com o `sprint-status.yaml` em dia).
- Não quebrou nenhum invariante da Seção 5.
- Se codou: `tsc --noEmit` limpo e **zero imports não usados** (quebram o build).

---

## 3. 📚 Ordem de leitura do contexto (antes de codar)

Leia nesta ordem — são a base de tudo:

| # | Arquivo | Para quê |
|---|---|---|
| 1 | `../Importantdoc.md` | **Contrato-da-verdade** da fundação MasIA (gateway, schema §B4, RBAC). Seguir à risca. |
| 2 | `../LOVEABLE-BRIEF.md` | O produto Knowledge Vault: telas, papéis, modelo de dados. |
| 3 | `../mentalidadeauditoria.md` | Régua de qualidade (erros, validação, IDOR, zero-trust). |
| 4 | `planning-artifacts/epics.md` | Índice dos épicos + a tese arquitetural + o achado crítico de RBAC. |
| 5 | `implementation-artifacts/sprint-status.yaml` | Estado atual (o que já foi feito, o que falta). |
| 6 | a story atual | O passo concreto que você vai executar. |

---

## 4. 🗺️ Ordem recomendada (caminho crítico)

Os épicos **não** são estritamente sequenciais, mas esta é a ordem que minimiza retrabalho:

```
E1 (Fundação/Contrato/Camada de dados)
  └─> E2 (Schema Neon §B4)
        └─> E3 (Autorização & Zero-Trust)
              └─> E4 (Extensões: rota Publicar)
E5 (Tratamento de erros) ....... transversal — aplicar junto com E2–E4
E6 (Validação atômica) ......... transversal — aplicar junto com E2–E4
E7 (tenant-local Docker) ....... pode começar cedo, em paralelo, p/ testar E3/E6
```

- **Caminho crítico:** E1 → E2 → E3 → E4.
- **E5 e E6 são transversais**: cada regra de erro/validação é aplicada quando a entidade/rota
  correspondente é implementada (não deixe tudo para o fim).
- **E7 (tenant-local)** é o que permite **testar de verdade** os fluxos de segurança — vale subir
  cedo para validar E3/E6 contra casos negativos.

Os 7 épicos e suas 41 stories estão listados em `planning-artifacts/epics.md` e rastreados em
`implementation-artifacts/sprint-status.yaml`.

---

## 5. 🚧 Invariantes inegociáveis (não viole — leia antes de cada story)

Estas regras vêm do `Importantdoc.md` e do `mentalidadeauditoria.md`. Quebrá-las é bug crítico:

1. **Sem backend próprio.** Nada de Express/Nest/Next/servidor por-app. O backend é o gateway
   compartilhado. Acesso só via `db`/`auth`. (Exceção: o tenant-local do E7 é **dev-only**.)
2. **`owner_id` vem da sessão (gateway), NUNCA do front.** O front nunca envia/escolhe dono.
3. **`role` no front é cosmético** (esconder botões). A segurança real é 100% no gateway.
4. **Tabela sem `owner_id` = lookup**: rep só lê; manager/admin escrevem. É assim que a Base
   Compartilhada fica segura, sem código de autorização.
5. **Tabela escrita pelo rep precisa de `owner_id`** — inclusive filhas (`document_reference`,
   `favorite`), senão o rep toma 403.
6. **Sem get-by-id, sem filtro no servidor, sem join.** Tudo é `list` + filtrar no front.
7. **Nada sensível é confiado ao front.** Confirmação de exclusão, papel, tenant, owner — tudo é
   validado no servidor. O front só exibe.
8. **Arquivos protegidos** (`client.ts`, `types.gen.ts`, migrations, etc.) não se editam à mão.
9. **Build limpo**: TypeScript strict, zero imports não usados (quebram o build).

---

## 6. 🗂️ Mapa de arquivos deste pacote

```
_bmad-output/
  START-AQUI.md                         <- VOCÊ ESTÁ AQUI (controle + protocolo)
  planning-artifacts/
    epics.md                            <- índice dos épicos + tese arquitetural
  implementation-artifacts/
    sprint-status.yaml                  <- FONTE-DA-VERDADE do progresso
    1-1-...  ...  7-5-...                <- as 41 stories
```

**Regra final:** terminou algo? Atualize a `sprint-status.yaml` (+ o Status e os checkboxes da
story). Sempre.
