# ADR-003 — Integridade das Referências e Diagnóstico Simples

## Status

**Aprovado**

---

# Contexto

O Knowledge Vault permite que documentos Markdown criem referências para outros documentos do Vault.

Como documentos podem ser movidos, renomeados, enviados para a lixeira ou removidos permanentemente, a aplicação deve ser capaz de informar quando uma referência deixa de ser válida.

O objetivo não é transformar o editor em uma IDE, mas fornecer um feedback simples sobre a integridade das referências existentes.

---

# Decisão

A aplicação possuirá um mecanismo simples de validação das referências entre documentos.

Esse mecanismo verificará apenas se uma referência continua apontando para um documento válido.

---

# Objetivo

Garantir que referências permaneçam consistentes durante toda a vida útil do Vault.

O sistema deverá detectar situações em que uma referência não possa mais ser resolvida.

---

# Casos Monitorados

Inicialmente, apenas os seguintes cenários serão tratados:

- documento removido permanentemente;
- documento localizado na lixeira;
- referência que não pode mais ser resolvida.

Não haverá sugestões automáticas, correções, autocomplete inteligente ou funcionalidades típicas de IDEs.

---

# Comportamento

Durante a renderização de um documento Markdown:

- referências válidas serão exibidas normalmente;
- referências inválidas deverão ser identificadas visualmente pela interface.

Caso o usuário tente navegar para uma referência inválida:

- a navegação será cancelada;
- o usuário permanecerá na página atual;
- será exibido um Toast informando que o documento não está disponível.

---

# Movimentação e Renomeação

Referências não dependem do nome ou do caminho do documento.

Como a navegação é baseada em um identificador permanente, operações como:

- mover documentos;
- mover pastas;
- renomear documentos;
- reorganizar a árvore;

não invalidam referências existentes.

A validação só falhará quando o documento deixar de existir ou não puder mais ser acessado.

---

# Responsabilidades

## Domínio

Responsável por determinar se uma referência pode ou não ser resolvida.

## Interface

Responsável por:

- indicar visualmente referências inválidas;
- impedir a navegação;
- apresentar mensagens ao usuário por meio de Toasts.

---

# Benefícios

- Simplicidade de implementação.
- Baixo acoplamento.
- Navegação consistente.
- Feedback claro ao usuário.
- Arquitetura preparada para evoluções futuras sem adicionar complexidade desnecessária.

---

# Fora do Escopo

Nesta versão, não fazem parte da arquitetura:

- sugestões automáticas de documentos;
- correção automática de referências;
- diagnósticos avançados;
- análise semântica do conteúdo;
- funcionalidades semelhantes às de IDEs.

Essas possibilidades poderão ser avaliadas futuramente, caso tragam valor real ao produto.
