## Parte 2 — Guia detalhado

Um passo a passo das ações do dia a dia no seu workspace.

### Criar, renomear e excluir

No **Explorer** (o painel de pastas à esquerda do workspace):

- **Nova pasta / novo documento** — use os botões no topo do Explorer, ou o menu
  `⋯` de uma pasta para criar algo **dentro** dela.
- **Renomear** — abra o menu `⋯` do item e escolha _Renomear_. O nome vira um
  campo editável ali mesmo; pressione **Enter** para salvar ou **Esc** para
  cancelar.
- **Excluir** — pelo menu `⋯`. Excluir uma pasta remove tudo o que está dentro,
  então há uma confirmação antes.

> Ao criar um documento e deixar o nome vazio, ele é descartado — nada é salvo
> sem nome.

### Reorganizar arrastando

- **Arraste** um documento ou pasta e **solte** sobre outra pasta para movê-lo
  para dentro dela.
- Solte na área vazia (raiz) para tirá-lo de todas as pastas.
- Você só pode mover itens que são seus.

### Escrever em Markdown

O editor aceita Markdown com formatação **GitHub-flavored**. O que dá para usar:

- Títulos com `#`, `##`, `###`…
- **Negrito** (`**texto**`), _itálico_ (`*texto*`), `código inline` (crases).
- Listas com `-` e listas numeradas com `1.`.
- Listas de tarefas:

- [x] item concluído
- [ ] item pendente

- Citações com `>`.
- Tabelas (rolam horizontalmente quando ficam largas):

| Comando | Efeito                    |
| ------- | ------------------------- |
| `**x**` | deixa `x` em negrito      |
| `> x`   | transforma `x` em citação |

- **Blocos de código com realce de sintaxe** — abra uma cerca ` ``` ` seguida da
  linguagem:

```typescript
function saudacao(nome: string): string {
  return `Olá, ${nome}!`;
}
```

```python
def saudacao(nome: str) -> str:
    return f"Olá, {nome}!"
```

Linguagens com realce: **bash, c, cpp, csharp, css, diff, dockerfile, go, ini
(toml), java, javascript, json, markdown, php, python, ruby, rust, sql,
typescript, xml (html)** e **yaml** — com os apelidos usuais (`ts`, `js`, `py`,
`rs`, `sh`, `yml`…). Uma linguagem desconhecida cai em texto simples, sem erro.

### Salvar

O editor salva **automaticamente** enquanto você escreve; o botão _Salvar_ força
a gravação na hora.
