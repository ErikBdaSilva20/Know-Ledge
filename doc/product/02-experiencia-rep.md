# Knowledge Vault

> **Documento 02 — UX do Usuário (Rep) e Funcionalidades**
>
> **Status:** Em definição
>
> **Escopo:** Este documento descreve exclusivamente a experiência do usuário (Rep), sua interface e funcionalidades. Nenhuma decisão de arquitetura, banco de dados ou implementação técnica é definida neste documento.

---

# Objetivo

O objetivo deste documento é definir como será a experiência do usuário dentro da aplicação.

Neste momento, não estamos preocupados com implementação.

O foco é responder apenas uma pergunta:

> **"O que o usuário consegue fazer dentro da aplicação?"**

---

# Perfil do Usuário

Neste documento existe apenas um perfil.

## Rep

O Rep é o usuário comum da aplicação.

Seu objetivo é criar, organizar e consultar conhecimento.

Toda a experiência do sistema será construída inicialmente pensando nele.

A visão administrativa será documentada posteriormente em outro documento.

---

# Filosofia da Interface

A aplicação deve transmitir a sensação de estar navegando em uma biblioteca de conhecimento.

Ela não pretende substituir um editor de código.

Ela não pretende substituir um explorador de arquivos.

Ela pretende facilitar a organização, escrita e consulta de conhecimento.

Toda funcionalidade adicionada deve responder pelo menos uma destas perguntas:

- Isso facilita escrever conhecimento?
- Isso facilita encontrar conhecimento?
- Isso facilita conectar conhecimento?

Caso contrário, a funcionalidade provavelmente não faz parte do escopo do produto.

---

# Estrutura Geral da Interface

A interface será composta por poucos elementos principais.

## Sidebar

A Sidebar será o principal meio de navegação.

Ela permanecerá sempre visível durante a utilização da aplicação.

Nela estarão presentes os principais atalhos do sistema.

Exemplo de estrutura:

- Dashboard
- Workspace
- Favoritos
- Recentes
- Busca
- Graph View
- Configurações

A organização visual definitiva será definida posteriormente.

---

## Explorer

O Explorer representa a estrutura de organização dos documentos.

Seu comportamento será semelhante ao encontrado em aplicações como Obsidian.

O usuário deverá conseguir navegar livremente entre pastas e documentos.

A navegação deve ser rápida e intuitiva.

---

## Área Principal

A área principal será responsável por exibir:

- Dashboard
- Editor
- Visualização de documentos
- Busca
- Outras telas da aplicação

Sempre existirá apenas um conteúdo principal sendo exibido.

---

# Organização

O usuário poderá organizar seu Workspace utilizando pastas.

O objetivo não é limitar a organização.

Cada usuário poderá estruturar seu conhecimento da forma que considerar mais adequada.

---

## Funcionalidades das Pastas

O usuário poderá:

- Criar pastas
- Criar subpastas
- Renomear pastas
- Mover pastas
- Arrastar pastas utilizando Drag and Drop
- Excluir pastas

A experiência deve ser simples e semelhante à encontrada em exploradores modernos.

---

# Documentos

Todo conhecimento da aplicação será representado por documentos.

Cada documento será considerado uma unidade independente de conhecimento.

O foco da aplicação será o conteúdo textual.

---

## Formato

O formato principal da aplicação será Markdown (.md).

Toda a experiência será construída considerando Markdown como formato nativo.

Não haverá múltiplos tipos de documentos editáveis.

Markdown será o único formato de edição do sistema.

---

# Editor

O editor será responsável pela criação e manutenção do conteúdo.

Neste momento não será decidido qual tecnologia será utilizada.

Apenas definimos quais comportamentos esperamos.

---

## Funcionalidades do Editor

O usuário poderá:

- Criar documentos
- Editar documentos
- Renomear documentos
- Mover documentos entre pastas
- Duplicar documentos
- Excluir documentos
- Favoritar documentos

O editor deverá priorizar velocidade e simplicidade.

---

## Markdown

O sistema deverá oferecer uma excelente experiência para escrita em Markdown.

Entre os recursos esperados estão:

- Títulos
- Subtítulos
- Listas
- Checklists
- Tabelas
- Blocos de código
- Citações
- Links
- Separadores
- Destaques

A renderização deverá ser agradável e legível.

---

# Salvamento

O usuário não precisará salvar manualmente seus documentos.

A aplicação deverá realizar salvamentos automáticos.

O salvamento deverá ocorrer alguns segundos após a última alteração realizada pelo usuário.

Além disso, o sistema poderá realizar salvamentos em eventos importantes, como mudança de documento ou saída da tela.

O objetivo é evitar perda de informações.

---

# Exclusão

A exclusão será permanente.

Não existirá lixeira.

Antes da exclusão o sistema deverá solicitar confirmação do usuário.

A confirmação deverá deixar claro que a ação é irreversível.

O objetivo é evitar exclusões acidentais.

---

# Ligações entre Documentos

Uma das principais características do sistema será a possibilidade de conectar documentos.

Documentos poderão fazer referência a outros documentos da base de conhecimento.

O objetivo é permitir a construção de uma rede de conhecimento ao invés de uma coleção isolada de arquivos.

O funcionamento interno dessas referências será definido futuramente.

---

# Backlinks

Ao abrir um documento, o usuário deverá conseguir visualizar quais outros documentos fazem referência a ele.

Isso permitirá compreender o contexto daquele conhecimento dentro da base da empresa.

---

# Navegação

A navegação entre documentos deve ser rápida.

O usuário deve conseguir abrir documentos relacionados com poucos cliques.

A experiência deve incentivar a descoberta de conhecimento.

---

# Busca

A busca será uma das funcionalidades centrais do sistema.

O usuário deverá conseguir localizar documentos rapidamente.

A busca deverá considerar, futuramente, diferentes critérios como:

- título
- conteúdo
- pastas
- favoritos

A estratégia de implementação será definida posteriormente.

---

# Favoritos

O usuário poderá marcar documentos importantes.

Os favoritos servirão como acesso rápido aos conteúdos mais utilizados.

---

# Recentes

O sistema manterá uma lista automática dos documentos acessados recentemente.

Essa lista facilitará o retorno ao trabalho anterior.

---

# Dashboard

Ao acessar a aplicação, o usuário deverá visualizar uma tela inicial.

O objetivo do Dashboard será facilitar a continuidade do trabalho.

Entre os conteúdos considerados para esta tela estão:

- documentos recentes;
- documentos favoritos;
- últimos documentos editados;
- atalhos para criação de novos documentos.

A composição definitiva do Dashboard será definida posteriormente.

---

# Graph View

O sistema possuirá uma visualização gráfica das conexões entre documentos.

Esta funcionalidade representa uma das principais identidades do produto.

Seu objetivo não será apenas criar uma visualização bonita.

Ela deverá permitir que o usuário descubra relações entre documentos e navegue pela base de conhecimento de forma visual.

A implementação será discutida futuramente.

---

# Funcionalidades previstas para o MVP

## Organização

- Criar pastas
- Criar subpastas
- Renomear pastas
- Mover pastas
- Excluir pastas
- Drag and Drop

---

## Documentos

- Criar documentos
- Editar documentos
- Renomear documentos
- Duplicar documentos
- Mover documentos
- Excluir documentos
- Favoritar documentos

---

## Conteúdo

- Markdown como único formato
- Renderização rica
- Auto Save

---

## Conhecimento

- Referências entre documentos
- Backlinks
- Descoberta de documentos relacionados
- Graph View

---

## Navegação

- Explorer
- Dashboard
- Favoritos
- Recentes
- Busca

---

# Funcionalidades fora do escopo inicial

As funcionalidades abaixo são consideradas futuras evoluções e não fazem parte do MVP.

- Histórico de versões
- Templates
- Colaboração em tempo real
- Comentários
- Compartilhamento externo
- Plugins
- Inteligência Artificial
- Versionamento
- Sincronização com serviços externos
- Edição colaborativa
- Upload de arquivo (PDF, DOCX ou qualquer binário)

---

# Observações

Este documento não define:

- arquitetura;
- banco de dados;
- entidades;
- relacionamentos;
- permissões;
- estrutura das tabelas;
- estratégia de armazenamento;
- tecnologias utilizadas.

Todas essas decisões serão tomadas posteriormente em um documento dedicado exclusivamente à arquitetura do sistema.
