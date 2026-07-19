# ADR-001 — Referências entre documentos e navegação

## Status

**Aprovado**

---

# Contexto

O Knowledge Vault armazena documentos Markdown (`.md`), organizados em pastas (ADR-004 — markdown-only, sem PDF/DOCX/outros formatos).

---

# Decisão

Documentos Markdown podem criar referências para outros documentos Markdown.

---

# Navegação

Quando um usuário clicar em uma referência dentro de um documento:

- caso o documento exista, a aplicação navega até ele e abre no editor;
- a navegação é resolvida por identificador, nunca por nome/caminho.

---

# Identificação das referências

As referências **não devem depender** de:

- nome do arquivo;
- caminho da pasta;
- localização física do documento.

Cada documento possuirá um identificador único e permanente.

A navegação sempre será resolvida utilizando esse identificador.

Essa abordagem garante que renomeações ou movimentações de pastas não invalidem referências existentes.

---

# Exclusão de documentos

Quando um documento for removido:

- as referências existentes **não serão alteradas automaticamente**;
- o conteúdo Markdown permanecerá intacto;
- apenas a resolução da navegação deixará de funcionar.

O sistema preserva o histórico do documento, evitando modificações automáticas em conteúdos já escritos.

---

# Comportamento da interface

Ao tentar navegar para uma referência inexistente:

- a navegação será cancelada;
- o usuário permanecerá na página atual;
- a interface exibirá um **Toast** informando que o documento não foi encontrado.

Exemplo:

> "Este documento não existe mais."

A lógica de detectar uma referência inválida pertence ao domínio da aplicação. A forma de comunicar esse estado ao usuário é responsabilidade da interface.

---

# Benefícios desta decisão

- arquitetura simples;
- menor acoplamento entre documentos;
- referências resistentes a renomeações e movimentações;
- ausência de sincronizações complexas;
- experiência semelhante a IDEs modernas;
- facilidade para futuras funcionalidades, como backlinks, grafo de conhecimento e auditoria de referências quebradas.

---

# Consequências

## Positivas

- Modelo de dados mais simples.
- Navegação consistente.
- Links permanecem válidos após reorganização do Vault.
