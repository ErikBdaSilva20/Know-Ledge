# Knowledge Vault — Índice da Documentação

Esta pasta é dividida em três árvores com responsabilidades diferentes. Cada uma numera seus próprios documentos, independentemente das outras.

---

## `product/` — Visão de Produto e Experiência

O que o Knowledge Vault é, pra quem é, e como se usa. Sem decisões técnicas.

| # | Documento | Conteúdo |
|---|---|---|
| 01 | [`01-visao-geral.md`](./product/01-visao-geral.md) | Conceito, objetivos, público-alvo, inspirações (Obsidian/GitHub/Notion), diferencial |
| 02 | [`02-experiencia-rep.md`](./product/02-experiencia-rep.md) | UX de escrita/organização do usuário Rep — editor, pastas, backlinks, favoritos |
| 03 | [`03-fluxos-e-papeis.md`](./product/03-fluxos-e-papeis.md) | Diagramas de fluxo ponta-a-ponta (criação, upload, exclusão, publicação) e experiência do Admin/Manager |
| 04 | *(em aberto)* | Roadmap e Limitações — MVP vs. futuro, ainda não escrito |

---

## `architecture/` — Arquitetura Geral

Como o produto é construído sobre a fundação MasIA: stack, schema, modelo de acesso a dados.

| # | Documento | Conteúdo |
|---|---|---|
| 01 | [`01-stack-e-modelagem.md`](./architecture/01-stack-e-modelagem.md) | Stack técnica, limitações do CRUD genérico, schema SQL completo, matriz de visibilidade, base compartilhada |
| 02 | [`02-organizacao-frontend.md`](./architecture/02-organizacao-frontend.md) | Scaffold base, estrutura de pastas, camadas (data/domain/hooks/components/screens), fluxo de dados, cache, mapeamento `editable.allow`/`protect` |
| 03 | [`03-seguranca-zero-trust.md`](./architecture/03-seguranca-zero-trust.md) | Os 5 invariantes de autorização do gateway (owner_id, role, visibilidade, IDOR, gate ownerless), auditoria de conformidade do frontend, checklist de testes negativos para a Story 7.5 |
| 04 | [`04-tratamento-de-erros.md`](./architecture/04-tratamento-de-erros.md) | Envelope de erro, mapa de status HTTP, tipos de erro de domínio, logging/correlation-id, cascade/referências pendentes, timeout/retry/idempotência |
| 05 | [`05-validacao.md`](./architecture/05-validacao.md) | Bloco de validação: schema no boundary (Zod), whitelist, enums, limites de tamanho, FKs de negócio, sanitização XSS, rate limiting, UUID, concorrência otimista |

### `architecture/Decisions/` — ADRs

Decisões pontuais e aprovadas, uma por assunto:

- [ADR-001](./architecture/Decisions/ADR-001_Referencias_arquivos.md) — Referências entre documentos e navegação
- [ADR-002](./architecture/Decisions/ADR-002_Lixeira_esclusao.md) — Exclusão sem lixeira (permanente)
- [ADR-003](./architecture/Decisions/ADR-003_Ref&Diag.md) — Integridade das referências e diagnóstico
- [ADR-004](./architecture/Decisions/ADR-004_DocModel_Archive_type.md) — Modelo de documentos e tipos de arquivo
- [ADR-005](./architecture/Decisions/ADR-005_Modelo_Dominio&Persistencia.md) — Modelo de domínio e estratégia de persistência
Uma nova decisão pontual vira `ADR-006` e assim por diante — nunca edite um ADR aprovado para mudar de ideia; escreva um novo ADR que o supera. (Um ADR-006 sobre upload/storage de PDF/DOCX chegou a existir e foi deletado — o produto é markdown-only, ADR-004.)

---

## `agendSkill/AgentDev.md` — Agente de IA (operacional, fora desta numeração)

Não é documentação de produto nem de arquitetura — é o **handbook de comportamento da IA** usado ativamente para codar este projeto. É a única fonte de regras de comportamento de IA (não existe mais um `MASIA_AI_CONTEXT.md` separado; o conteúdo foi incorporado nele). Mantido fora de `product/`/`architecture/` intencionalmente, e sua localização não deve ser alterada sem avisar quem depende do caminho atual.

---

## Fora de `doc/`

- **`Importantdoc.md`** (raiz do projeto) — contrato técnico da fundação MasIA (tenant-gateway, CRUD genérico, regras de schema, papéis). Fonte externa e autoritativa; não é editado por este projeto, só consultado.

---

## Convenções

- Documentos de produto e arquitetura são numerados por pasta (`01`, `02`, `03`...), nunca globalmente.
- Um documento numerado (`0X-nome.md`) descreve visão ou arquitetura vigente — deve ser mantido consistente.
- Um ADR registra uma decisão pontual e sua justificativa — uma vez aprovado, não muda; é substituído por um novo ADR se a decisão mudar.
- Se um documento contradiz outro, o mais específico (ADR) vence sobre o mais geral (Documento numerado), e `Importantdoc.md` vence sobre qualquer decisão de produto/arquitetura deste projeto.
