# ADR-004 — Modelo de Documentos (Markdown-only)

## Status

**Aprovado**

---

# Contexto

O Knowledge Vault é uma aplicação voltada para organização e navegação de conhecimento.

Versões anteriores desta decisão previam suporte a PDF e DOCX como documentos de primeira classe. Isso foi revertido: o projeto não vai lidar com upload/armazenamento de arquivo binário — decisão consciente para evitar qualquer necessidade de infraestrutura própria além do que a fundação MasIA já oferece (nada de storage externo, nada de serviço próprio).

---

# Decisão

**O único tipo de documento é Markdown (`.md`).**

Não existe mais campo "tipo" no documento — todo documento é Markdown, sempre.

---

# Princípios

O domínio é centrado em **Documentos** (todos Markdown).

Pastas existem apenas como estruturas de organização e não representam conhecimento.

---

# Renderização

- Editor Markdown.
- Preview em tempo real.

---

# Pastas

Pastas possuem exclusivamente responsabilidade organizacional.

Elas:

- agrupam documentos;
- organizam a navegação;
- podem conter outras pastas;
- podem ser movidas;
- podem ser renomeadas;
- podem ser removidas (permanentemente — ver [ADR-002](./ADR-002_Lixeira_esclusao.md)).

Pastas não:

- participam do grafo;
- possuem conteúdo;
- criam referências;
- recebem backlinks.

---

# Backlinks

Qualquer documento poderá exibir uma seção **"Referenciado por"**, indicando quais outros documentos apontam para ele.

Essa funcionalidade é derivada das referências existentes.

Backlinks **não serão persistidos** no banco de dados. Eles serão calculados sempre que necessário.

---

# Grafo

O grafo representa relacionamentos entre documentos (todos Markdown).

Pastas não participam do grafo por possuírem apenas função organizacional.

---

# Busca

Na primeira versão da aplicação, a busca será realizada apenas pelos títulos dos documentos e pastas.

Não fazem parte do escopo inicial:

- busca dentro do conteúdo Markdown;
- indexação Full Text Search;
- mecanismos avançados de pesquisa.

---

# Benefícios

- Modelo de domínio mínimo — um tipo só, sem ramificação de comportamento por tipo.
- Zero infraestrutura de storage de arquivo binário.
- Navegação e grafo simples e consistentes.

---

# Fora do Escopo

- Upload de arquivo (PDF, DOCX ou qualquer binário).
- Anexos de qualquer tipo.
- Busca pelo conteúdo dos arquivos, OCR, indexação avançada.
- Suporte a formatos além de `.md`.

> Se algum dia isso mudar, é uma decisão nova — registrar como ADR novo, não reabrir este.
