# Knowledge Vault

> **Documento 03 — Fluxos e Experiência**
>
> **Status:** Aprovado
>
> **Escopo:** Diagramas de fluxo (happy path) e experiência por papel. Não define arquitetura de dados nem implementação — para isso, ver [Documento 01 — Arquitetura, Stack e Modelagem](../architecture/01-stack-e-modelagem.md). Para a experiência detalhada de escrita/edição do Rep, ver [Documento 02](./02-experiencia-rep.md). Este documento complementa os dois com os fluxos ponta-a-ponta e a visão do Admin/Manager.
>
> Substitui os fluxos descritos em `Decisions/arquitetura.md` (arquivo removido — estava fora do padrão de ADR e continha decisões já revertidas, como lixeira).

---

# Visão Geral

```
Login

↓

Dashboard

├── Meu Workspace
├── Base Compartilhada
├── Busca
├── Grafo
├── Recentes
├── Favoritos
└── Administração (Admin / Manager)
```

---

# Estrutura da Interface

```
┌────────────────────────────────────────────┐
│ Header                                      │
├──────────────┬───────────────────────────────┤
│ Sidebar      │                               │
│              │                               │
│ Explorer     │      Área Principal           │
│ (pastas +    │                               │
│  documentos) │                               │
│              │                               │
├──────────────┴───────────────────────────────┤
│ Status Bar                                   │
└────────────────────────────────────────────┘
```

---

# Sidebar

Navegação principal, sempre visível (ver [Documento 02](./02-experiencia-rep.md)). Contém:

- Explorer (árvore de pastas + documentos do vault pessoal);
- Base Compartilhada;
- busca;
- recentes;
- favoritos;
- acesso ao grafo;
- acesso à Administração (visível só para `admin`/`manager`).

---

# Área Principal

Documento (sempre Markdown, ADR-004): editor + preview.

---

# Fluxo do Usuário — Primeiro Acesso

```
Usuário realiza login
        ↓
Workspace vazio
        ↓
Cria primeira pasta
        ↓
Cria primeiro documento
        ↓
Começa a registrar conhecimento
```

---

# Fluxo de Criação

```
Novo Documento
        ↓
Seleciona pasta
        ↓
Documento criado (Markdown, ADR-004)
        ↓
Editor é aberto automaticamente
```

---

# Fluxo de Referências

```
Durante a edição de um Markdown
        ↓
Usuário cria referência (só Markdown pode originar — ADR-001)
        ↓
Sistema resolve o documento por identificador permanente
        ↓
Referência criada (personal → personal/shared — Documento 02, §3.4)
        ↓
Ao clicar: navegação direta
```

---

# Fluxo de Navegação

```
Documento
    ↓
Clique
    ↓
Abrir
    ↓
Editor aberto
    ↓
Backlinks carregados (calculados em memória — Documento 02, §6)
    ↓
Grafo atualizado
```

---

# Fluxo de Exclusão

Não existe lixeira ([ADR-002](../architecture/Decisions/ADR-002_Lixeira_esclusao.md)). A exclusão é permanente e imediata.

```
Excluir documento (ou pasta)
        ↓
Confirmação explícita ("esta ação não pode ser desfeita")
        ↓
Documento removido permanentemente (remove do gateway)
        ↓
Referências que apontavam pra ele passam a exibir Toast
"documento não encontrado" ao serem clicadas (ADR-001/003)
```

---

# Fluxo de Busca

```
Usuário digita
        ↓
Busca por título, em memória (vault pessoal + base compartilhada)
        ↓
Resultados filtrados
        ↓
Selecionar resultado
        ↓
Documento aberto
```

---

# Fluxo do Grafo

```
Abrir grafo
        ↓
Carregar documentos (pessoais + base compartilhada)
        ↓
Carregar referências (document_references + shared_document_references)
        ↓
Construir nós e arestas em memória (Documento 02, §6)
        ↓
Renderizar conexões
```

---

# Fluxo de Publicação (Base Compartilhada)

Único a partir de `admin`/`manager` (ver [Documento 01, §5](../architecture/01-stack-e-modelagem.md#5-base-de-conhecimento-compartilhada-curadoria-pelo-admin)).

```
Admin/Manager abre um documento (próprio ou de qualquer Rep)
        ↓
Aciona "Publicar"
        ↓
Cópia criada em shared_documents (com source_document_id e published_by)
        ↓
Documento passa a aparecer na Base Compartilhada para todos os usuários do tenant
        ↓
(Cópia é independente — editar o original não atualiza a versão publicada)
```

---

# Experiência do Usuário (Rep)

Espaço focado em produtividade. Fluxo diário:

- registrar conhecimento;
- criar documentação;
- organizar pastas;
- criar referências;
- navegar entre documentos (vault pessoal e Base Compartilhada);
- pesquisar documentos;
- visualizar backlinks;
- favoritar documentos.

A aplicação deve minimizar distrações. Toda interação deve ser rápida e previsível.

O Rep **não** tem acesso a publicar documentos na Base Compartilhada — apenas consumi-la (Documento 02, §4).

---

# Experiência do Administrador / Manager

Além de tudo que o Rep tem acesso, possuem ferramentas de gerenciamento.

## Gestão de Documentos

Visualizam todos os documentos da empresa, independentemente do proprietário (comportamento padrão do gateway para `admin`/`manager` — Documento 02, §4). Permite:

- localizar documentos de qualquer usuário;
- reorganizar estrutura;
- remover documentos (permanentemente — ADR-002);
- acompanhar crescimento da base de conhecimento.

## Curadoria da Base Compartilhada

- Publicar um documento (próprio ou de um Rep) na Base Compartilhada;
- Editar ou remover um documento já publicado;
- Criar referências entre documentos da Base Compartilhada.

Ver fluxo completo acima e [Documento 01, §5](../architecture/01-stack-e-modelagem.md).

## Gestão da Estrutura

Podem reorganizar pastas, mover documentos, renomear estruturas e remover conteúdos obsoletos — sempre dentro do próprio tenant.

## Auditoria

Visão geral simples, sem dashboards complexos na V1:

- quantidade de documentos;
- quantidade de pastas;
- documentos recentes;
- documentos publicados na Base Compartilhada.

---

# Permissões (resumo de experiência — para a matriz de tabelas, ver Documento 02, §4)

## Rep

Pode:

- criar, editar, mover e excluir os próprios documentos e pastas;
- criar referências a partir dos próprios Markdowns (para documentos pessoais ou da Base Compartilhada);
- favoritar documentos;
- utilizar busca e grafo (vault pessoal + Base Compartilhada).

## Manager

Possui todas as permissões do Rep. Além disso:

- visualizar e organizar documentos de qualquer usuário;
- **publicar documentos na Base Compartilhada** (criar/editar/remover em `shared_documents`).

## Admin

Possui controle total sobre o Workspace da empresa. Além das permissões do Manager:

- visualizar todos os usuários e seus papéis;
- reorganizar toda a estrutura de qualquer usuário;
- remover permanentemente qualquer documento ou pasta.

---

# Comunicação entre Módulos

- Workspace produz conhecimento.
- Base Compartilhada distribui conhecimento curado a todos os usuários do tenant.
- Busca encontra conhecimento (pessoal + compartilhado).
- Grafo visualiza relacionamentos.
- Pastas organizam documentos (só no vault pessoal — a Base Compartilhada é uma lista plana, sem pastas, por não ter `owner_id`).
- Referências conectam documentos.

Cada módulo possui responsabilidade única.

---

# Princípios da Interface

A aplicação deve transmitir sensação semelhante a um editor moderno. Prioridades:

- rapidez;
- simplicidade;
- navegação intuitiva;
- baixa quantidade de cliques;
- foco no conteúdo.

A interface deve priorizar o documento. A aplicação nunca deve competir visualmente com o conteúdo criado pelo usuário.

---

# Objetivo Final

Ao abrir o Knowledge Vault, o usuário deve sentir que está utilizando uma ferramenta construída exclusivamente para organizar conhecimento.

Toda funcionalidade da aplicação deve reforçar esse objetivo. Qualquer nova funcionalidade futura deverá responder à seguinte pergunta:

> "Isso melhora a organização e o acesso ao conhecimento?"

Caso a resposta seja negativa, essa funcionalidade não pertence ao núcleo do produto.
