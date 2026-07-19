# Story 6.7: [VALIDAÇÃO] Conteúdo Markdown — sanitização de render e defesa contra XSS

Status: ready-for-dev

## Story

As a **responsável pela segurança de conteúdo**,
I want **o Markdown armazenado como texto cru mas renderizado com sanitização, e validado quanto a tipo/tamanho no servidor**,
so that **um documento não vire vetor de XSS quando lido por outro usuário na base compartilhada**.

## Acceptance Criteria

1. `content` é **armazenado como texto Markdown cru** (o backend não interpreta) — mas o servidor valida que é **string** dentro do limite (Stories 6.1/6.5), nunca binário/upload. [Source: LOVEABLE-BRIEF.md#2.3][Source: mentalidadeauditoria.md#5.6]
2. A **renderização no front** sanitiza a saída (ex.: markdown → HTML com allow-list, sem `<script>`, sem `on*=`, sem `javascript:`), pois documentos compartilhados são lidos por **outros usuários**. [Source: mentalidadeauditoria.md#5.6][Source: LOVEABLE-BRIEF.md#5.5]
3. Está documentado o **modelo de ameaça**: XSS armazenado — um rep escreve Markdown malicioso, um manager publica, outros leem. A sanitização na renderização é a defesa; o servidor não "conserta" o conteúdo, mas garante tipo/tamanho. [Source: mentalidadeauditoria.md#5.6]
4. A sanitização de render vive na **camada de apresentação** (componente de preview), não nos repos — mas é um requisito de segurança rastreável. [Source: mentalidadeauditoria.md#6.1]
5. Links internos (`[[...]]`) são resolvidos com validação (destino existe/visível, Story 4.2/6.6) e navegação controlada (sem `javascript:`). [Source: LOVEABLE-BRIEF.md#6]
6. Está registrado que **não há upload de arquivo** — reduz drasticamente a superfície (sem SVG/HTML/binário). [Source: LOVEABLE-BRIEF.md#2.3][Source: LOVEABLE-BRIEF.md#8]

## Tasks / Subtasks

- [ ] Task 1: Definir a política de armazenamento cru + validação de tipo/tamanho (AC: #1)
- [ ] Task 2: Definir a sanitização de render (allow-list de tags/atributos) (AC: #2, #4)
- [ ] Task 3: Documentar o modelo de ameaça XSS armazenado (AC: #3)
- [ ] Task 4: Definir a resolução segura de `[[links]]` (AC: #5) — linkar Story 4.2

## Dev Notes

- Input sanitization / XSS é item de segurança do checklist. Aqui o risco é **XSS armazenado via base compartilhada** (conteúdo de um usuário renderizado para outros). [Source: mentalidadeauditoria.md#5.6]
- O backend guarda texto; a defesa primária é **sanitizar na renderização** (a fundação não interpreta Markdown). O servidor complementa validando string/tamanho. [Source: LOVEABLE-BRIEF.md#2.3]
- Como o único tipo de conteúdo é Markdown (sem upload), não há vetores de arquivo — decisão de escopo que ajuda a segurança. [Source: LOVEABLE-BRIEF.md#8]

### Project Structure Notes

- Render sanitizado no componente de preview (apresentação). Validação de tipo/tamanho no gateway (Stories 6.1/6.5). Rastreável como requisito de segurança mesmo vivendo no front.

### References

- [Source: mentalidadeauditoria.md#5.6] — Input sanitization / XSS
- [Source: LOVEABLE-BRIEF.md#2.3] — só Markdown, sem upload
- [Source: LOVEABLE-BRIEF.md#5.5] — base compartilhada lida por todos

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
