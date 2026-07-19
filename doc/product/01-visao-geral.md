# Knowledge Vault

> **Documento 01 — Visão Geral, Conceito e Objetivos**
>
> **Status:** Em discussão (nenhuma decisão técnica definitiva)
>
> **Nota de atualização:** parte das perguntas técnicas deixadas em aberto neste documento (modelagem, tipos de documento, referências, estrutura de persistência) já foi respondida pelos ADRs 001–005 e pelo [Documento 01 — Arquitetura, Stack e Modelagem](../architecture/01-stack-e-modelagem.md). Este documento permanece como registro da visão de produto original; para decisões técnicas vigentes, use os documentos de `doc/architecture/`.
>
> **Estrutura da documentação (atualizada):** os documentos de produto ficam em `doc/product/` (numerados independentemente: 01, 02, 03...) e os de arquitetura em `doc/architecture/` (stack/schema + `Decisions/` com os ADRs). O antigo esquema único "01 a 04" descrito no rodapé deste documento foi substituído por essa separação.

---

# Visão

A proposta deste projeto é construir uma aplicação inspirada em ferramentas como **Obsidian**, **Notion** e **GitHub**, porém adaptada para o contexto empresarial e para a arquitetura da MasIA.

A ideia não é criar um clone do Obsidian.

O objetivo é desenvolver um **Knowledge Vault**, onde cada usuário possui seu próprio espaço para armazenar conhecimento da empresa de forma organizada, pesquisável e interligada.

Enquanto o Obsidian é voltado para uso pessoal, este projeto busca atender equipes e empresas, permitindo que administradores acompanhem o conhecimento produzido pelos colaboradores.

---

# Objetivo Principal

Criar uma base de conhecimento simples, organizada e extremamente rápida para consulta.

O foco não é substituir Google Drive, Dropbox ou SharePoint.

O foco é organizar conhecimento.

Cada documento deve representar uma informação importante da empresa.

Exemplos:

- Documentações
- Procedimentos internos
- Tutoriais
- Relatórios
- Pesquisas
- Estudos
- Anotações
- Reuniões
- Processos internos
- Padrões de desenvolvimento
- Boas práticas
- Wikis

---

# Público-alvo

O sistema deve servir para praticamente qualquer empresa que precise organizar conhecimento.

Exemplos:

- Software House
- Escritórios de Advocacia
- Escritórios Contábeis
- Agências
- Clínicas
- Consultorias
- Empresas de Engenharia
- Recursos Humanos
- Equipes de Marketing
- Pequenos negócios

A aplicação não deve ser específica para um único nicho.

Ela deve funcionar como um "segundo cérebro" da empresa.

---

# Inspirações

O projeto busca inspiração em diferentes ferramentas.

## Obsidian

Principal inspiração.

Especialmente:

- Vault
- Pastas
- Arquivos
- Links entre documentos
- Graph View
- Backlinks

Não pretende copiar todas as funcionalidades.

Apenas utilizar os conceitos que tornam o fluxo de conhecimento agradável.

---

## GitHub

Principal referência para visualização de Markdown.

Objetivos:

- Markdown bonito
- Tabelas
- Código
- Checklists
- Blocos
- Citações

---

## Notion

Referência para organização visual.

Principalmente:

- Navegação
- Sidebar
- Hierarquia
- Organização do conteúdo

Não necessariamente utilizar páginas em blocos como o Notion.

---

# Diferencial

O grande diferencial não é ser um editor Markdown.

Existem centenas.

O diferencial é transformar documentos independentes em uma rede de conhecimento.

Exemplo:

```
Cliente XPTO

↓

Contrato

↓

Reunião

↓

Decisão

↓

Implementação

↓

Entrega
```

Cada informação pode referenciar outra, formando uma base de conhecimento conectada.

---

# Filosofia do Projeto

O conhecimento deve ser:

- fácil de escrever;
- fácil de encontrar;
- fácil de relacionar;
- fácil de evoluir.

A aplicação deve incentivar o usuário a criar conexões entre documentos, em vez de manter arquivos isolados.

---

# O que NÃO queremos decidir agora

Neste momento, propositalmente não serão tomadas decisões sobre:

- arquitetura do projeto;
- modelagem do banco;
- estrutura das tabelas;
- tecnologia do editor;
- mecanismo de armazenamento;
- formato interno das referências;
- estrutura de pastas;
- tipos de documentos;
- estratégia de upload;
- organização técnica do frontend.

Essas decisões serão discutidas posteriormente.

Este documento define apenas o produto e sua visão.

---

# Premissas

Algumas premissas já podem ser consideradas.

- O projeto deve respeitar a arquitetura da fundação MasIA.
- Deve funcionar utilizando apenas os recursos já disponíveis na fundação, sempre que possível.
- O sistema deve ser simples de entender.
- O foco inicial deve ser produtividade, e não quantidade de funcionalidades.
- A experiência do usuário deve ser priorizada em relação à complexidade técnica.

---

# Perguntas que permanecem abertas

Estas perguntas deverão ser respondidas nos próximos documentos.

## Conteúdo

- Quais tipos de documentos existirão?
- Markdown será obrigatório ou opcional?
- Arquivos binários farão parte do MVP?

## Organização

- Como as pastas funcionarão?
- Um documento poderá existir em mais de uma pasta?
- Haverá tags?
- Haverá favoritos?

## Ligações

- Como os links internos funcionarão?
- Como localizar automaticamente documentos relacionados?
- Como exibir backlinks?

## Visualização

- Como será o Graph View?
- Como navegar entre documentos?
- Como exibir documentos relacionados?

## Busca

- Pesquisa por título?
- Pesquisa por conteúdo?
- Pesquisa por tags?
- Pesquisa por referências?

## Colaboração

- Um documento poderá ser compartilhado?
- O administrador poderá visualizar documentos de outros usuários?
- Haverá permissões específicas além das existentes na MasIA?

---

# Objetivo do próximo documento

O Documento 02 não irá tratar de arquitetura.

Ele deverá responder apenas uma pergunta:

> **Como o usuário utiliza a aplicação durante um dia de trabalho?**

Toda a experiência de uso será desenhada antes de qualquer decisão técnica.

01 - Visão Geral do Projeto (conceito, objetivos, diferenciais e produto)
02 - Arquitetura e Modelagem (banco, CRUD, entidades, referências, Markdown, etc.)
03 - UX/UI e Funcionalidades (Obsidian, Github, Notion, grafo, navegação, editor...)
04 - Roadmap e Limitações (MVP, futuras versões, decisões técnicas, compatibilidade com a fundação MasIA)
