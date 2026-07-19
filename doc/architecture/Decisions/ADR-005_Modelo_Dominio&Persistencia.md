# ADR-005 — Modelo de Domínio e Estratégia de Persistência

## Status

**Aprovado**

---

# Contexto

O Knowledge Vault será executado sobre a MasIA Foundation.

Toda persistência deve respeitar as limitações do gateway compartilhado, que oferece apenas operações genéricas de CRUD (`list`, `create`, `update` e `remove`), sem suporte nativo a `getById`, filtros complexos ou joins.

A arquitetura deve permanecer simples, previsível e facilmente evolutiva.

---

# Princípios

O domínio é centrado em **Documentos**.

Pastas existem exclusivamente para organização hierárquica.

Todos os comportamentos da aplicação devem partir desse modelo.

---

# Modelo de Domínio

A primeira versão do Knowledge Vault será composta pelos seguintes conceitos principais:

- Folder
- Document
- References

Não serão criadas entidades específicas para cada formato de arquivo.

O tipo do documento será definido por um atributo do próprio documento.

---

# Documento

Todo documento representa uma unidade de conhecimento dentro do Vault.

Independentemente do formato, todos compartilham a mesma identidade e o mesmo ciclo de vida.

Cada documento possuirá informações comuns como:

- identificador permanente;
- título;
- tipo;
- pasta de origem;
- proprietário;
- datas de criação e atualização.

Não existe estado de "lixeira": a exclusão é permanente e imediata (ver [ADR-002](./ADR-002_Lixeira_esclusao.md)). Se o documento existe, ele está ativo.

---

# Tipos de Documento

Único tipo: Markdown (ADR-004). Não existe campo "tipo" no domínio.

---

# Conteúdo

Documentos armazenam seu conteúdo textual diretamente no banco. Não há arquivo binário nem armazenamento externo.

---

# Pastas

Pastas possuem apenas responsabilidade organizacional.

Elas:

- agrupam documentos;
- organizam a árvore de navegação;
- podem conter outras pastas;
- podem ser movidas;
- podem ser removidas (permanentemente — ver [ADR-002](./ADR-002_Lixeira_esclusao.md)).

Pastas não possuem conteúdo próprio e não participam das relações de conhecimento.

---

# Referências

As referências existem exclusivamente entre documentos.

Pastas nunca participam de referências.

Todo documento pode criar e ser destino de referências (todos são Markdown).

Backlinks são calculados dinamicamente e nunca persistidos.

---

# Estratégia de Persistência

A arquitetura deverá minimizar a quantidade de entidades persistidas.

Sempre que possível, informações derivadas serão calculadas pela aplicação em vez de armazenadas no banco.

Exemplos:

- backlinks;
- estrutura do grafo;
- resultados de busca em memória;
- estados da interface.

---

# Estratégia de Carregamento

Considerando as limitações do gateway, a aplicação adotará um modelo de carregamento baseado em listas.

As telas carregarão coleções completas e realizarão filtros localmente quando necessário.

A arquitetura não dependerá de operações `getById` ou joins no servidor.

---

# Busca

Na primeira versão, a busca será realizada apenas sobre os títulos de documentos e pastas.

A pesquisa ocorrerá em memória após o carregamento dos dados.

Indexação de conteúdo, Full Text Search, OCR e mecanismos avançados ficam fora do escopo inicial.

---

# Grafo

O grafo será considerado uma projeção do domínio.

Ele será construído dinamicamente a partir das referências existentes entre documentos.

Nenhuma estrutura específica do grafo será persistida no banco.

---

# Estado da Aplicação

A arquitetura separa claramente três categorias de estado:

## Estado Persistido

Dados armazenados no banco:

- documentos;
- pastas;
- referências;
- preferências persistentes futuras.

## Estado de Servidor

Dados carregados pelo gateway e mantidos em cache pela aplicação.

## Estado de Interface

Informações exclusivamente visuais, como:

- documento selecionado;
- pastas expandidas;
- painéis abertos;
- posição do grafo;
- filtros temporários.

Esses estados não pertencem ao domínio e não serão persistidos.

---

# Simplicidade

A arquitetura evita criar entidades ou estruturas antecipadamente.

Toda nova entidade deverá representar uma necessidade real do domínio.

Funcionalidades derivadas deverão ser implementadas preferencialmente por composição dos dados existentes, evitando duplicação de informações.

---

# Benefícios

- Modelo de domínio reduzido e consistente.
- Baixo acoplamento entre formatos de documentos.
- Compatibilidade total com o gateway da MasIA Foundation.
- Facilidade para evolução futura.
- Menor complexidade de manutenção.
- Redução de duplicação de dados.
- Separação clara entre domínio, persistência e interface.

---

# Nota de complemento

Duas extensões deste modelo foram decididas posteriormente e são formalizadas no **[Documento 01 — Arquitetura, Stack e Modelagem](../01-stack-e-modelagem.md)**:

- **Favorite** — confirmado no escopo do MVP (não é mais "futuro").
- **Base de conhecimento compartilhada** — um documento pode ser promovido pelo admin/manager para uma tabela pública separada (`shared_documents`), sem `owner_id`, visível a todos os usuários. Ver Documento 02 para o racional completo (a visibilidade do gateway é por tabela, não por linha).
