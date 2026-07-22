## Parte 3 — Referências entre arquivos

Um dos maiores ganhos do Knowledge Vault é **conectar documentos**. Uma
referência (ou _wiki-link_) é um link de um documento para outro.

### Como criar um link

1. No editor, digite `[[`.
2. Um autocomplete aparece — escolha o documento pelo título.
3. Pronto: o link fica gravado como `[[Título do documento|id]]`.

O **id** embutido é o que importa: o link aponta para o documento em si, então
ele **continua funcionando mesmo que o documento seja renomeado**. O título no
link é só o texto exibido.

> Se você escrever `[[Algum título]]` à mão, sem escolher no autocomplete, o link
> tenta casar pelo título. Prefira sempre o autocomplete para embutir o id.

### Onde as referências aparecem

- **No texto renderizado** — o link vira uma "pílula" clicável. Um losango
  cheio (◆) marca um documento **pessoal**; um losango vazado (◇) marca um
  documento da **Base Compartilhada**. Um link que não resolve fica inerte e
  marcado como _não encontrado_.
- **No painel "Referenciado por"** — no topo de cada documento, a lista de
  _backlinks_: quais outros documentos apontam para este.
- **No Grafo** — cada referência vira uma **linha sólida com seta** ligando os
  dois documentos (a origem aponta para o alvo). As linhas **pontilhadas** do
  grafo são de _contenção_ (pasta → documento), não de referência.

### Boas práticas

- [ ] Dê **títulos claros** aos documentos — eles alimentam o autocomplete.
- [ ] Prefira o **autocomplete** a digitar o link à mão (id estável).
- [ ] Revise os _backlinks_ antes de excluir um documento — outros podem
      depender dele.
- [ ] Evite links **quebrados**: se um alvo some, o link fica marcado como não
      encontrado.

> Dica: abra o **Grafo** de tempos em tempos para enxergar como seu conhecimento
> está conectado — clusters densos e documentos isolados contam histórias
> diferentes.
