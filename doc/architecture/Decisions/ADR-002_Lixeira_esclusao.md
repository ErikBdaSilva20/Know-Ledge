# ADR-002 — Exclusão de Documentos e Pastas (Sem Lixeira)

## Status

**Aprovado**

---

# Contexto

O Knowledge Vault precisa de uma política clara para exclusão de documentos e pastas.

Duas abordagens foram consideradas:

- **Lixeira temporária**, com retenção configurável e possibilidade de restauração;
- **Exclusão permanente**, com confirmação explícita do usuário.

Uma lixeira exige estado adicional por registro (ex.: `deleted_at`), uma rotina de purga (manual ou agendada) e regras de visibilidade adicionais (itens na lixeira não devem aparecer em listas, busca, grafo ou backlinks). Isso aumenta a complexidade do domínio e do CRUD genérico da fundação, que já opera apenas com `list/create/update/remove`.

---

# Decisão

**Não existirá lixeira.**

A exclusão de documentos e pastas é **permanente e imediata**, executada via `remove` do gateway.

Antes de excluir, a interface deverá exibir uma confirmação explícita, deixando claro que a ação **não pode ser desfeita**.

---

# Escopo

Esta decisão se aplica a:

- Documentos (Markdown);
- Pastas (e todo o seu conteúdo, ver "Exclusão de pastas" abaixo).

---

# Exclusão de pastas

Ao excluir uma pasta, o usuário deve ser avisado se ela contém documentos ou subpastas.

A aplicação deverá exigir confirmação adicional quando a pasta não estiver vazia, explicitando que os documentos contidos também serão removidos permanentemente.

---

# Referências quebradas

Documentos excluídos permanentemente deixam de existir para fins de resolução de referências.

O comportamento de referências para documentos inexistentes já está definido em [ADR-001](./ADR-001_Referencias_arquivos.md) e [ADR-003](./ADR-003_Ref&Diag.md): a navegação é cancelada e a interface exibe um Toast informando que o documento não foi encontrado.

---

# Consequências

## Positivas

- Nenhum estado adicional de "exclusão" no modelo de domínio — `remove` do gateway é suficiente.
- Nenhuma rotina de purga a manter.
- Listagens, busca, grafo e backlinks não precisam filtrar itens "na lixeira" — se o `list()` retornou, o item existe.
- Compatível com a filosofia de simplicidade do projeto (ver [ADR-005](./ADR-005_Modelo_Dominio&Persistencia.md), seção "Simplicidade").

## Limitações

- Exclusões acidentais são irreversíveis. A mitigação é exclusivamente a confirmação explícita na interface — não há rede de segurança no backend.
- Não há histórico do que foi excluído.

---

# Nota de correção

Esta decisão substitui qualquer menção anterior a lixeira, retenção temporária ou restauração de documentos/pastas em outros documentos do projeto (ex.: rascunhos de resumo gerados antes desta ADR). Este ADR é a fonte oficial sobre o tema.
