# Story 4.3: Limites do modo genérico — o que NÃO precisa de backend novo (e o que precisaria)

Status: ready-for-dev

## Story

As a **arquiteto evitando trabalho desnecessário no gateway**,
I want **um mapa claro do que cabe no CRUD genérico vs. o que exigiria extensão**,
so that **a equipe não prometa extensões que não são necessárias nem ignore as que são**.

## Acceptance Criteria

1. Está documentado que **cabem no genérico** (sem extensão): Dashboard, Meu Workspace (CRUD de folder/document), Busca (list+filter no front), Grafo e Backlinks (derivados no front), Favoritos, Recentes (estado local), leitura da Base Compartilhada. [Source: Importantdoc.md#A3][Source: LOVEABLE-BRIEF.md#3][Source: LOVEABLE-BRIEF.md#5]
2. Está documentado que **exige extensão**: **Publicar** (Story 4.1) e, possivelmente, a **validação cross-scope de referências** (Story 4.2). [Source: Importantdoc.md#B6]
3. Está documentado que o Knowledge Vault **não tem** os gatilhos que exigem estender a fundação: sem realtime/colaboração, sem WhatsApp/chat, sem jobs/cron, sem webhooks/pagamento, sem upload/mídia, sem página pública sem login. [Source: Importantdoc.md#A3][Source: LOVEABLE-BRIEF.md#8]
4. "Recentes" é confirmado como **estado local** (não precisa nem entrar no banco). [Source: LOVEABLE-BRIEF.md#3]
5. Busca é **só por título, em memória** (não full-text, não server-side) — confirmado como fora de extensão. [Source: LOVEABLE-BRIEF.md#3][Source: LOVEABLE-BRIEF.md#8]
6. A "regra prática" do doc é aplicada: se precisar de "servidor fazendo X quando o usuário não está olhando" → extensão. O Knowledge Vault não tem nenhum caso desses. [Source: Importantdoc.md#A3]

## Tasks / Subtasks

- [ ] Task 1: Tabela "cabe no genérico" × tela (AC: #1, #4, #5)
- [ ] Task 2: Tabela "exige extensão" com justificativa (AC: #2)
- [ ] Task 3: Checklist negativo dos gatilhos de extensão que NÃO se aplicam (AC: #3, #6)

## Dev Notes

- Isto é uma **conclusão de risco baixo**: o Knowledge Vault é quase 100% "dados + telas", o cenário ideal da fundação (§A3 "CABE HOJE" — Wiki/KB é citado explicitamente). A única fricção real é Publicar. [Source: Importantdoc.md#A3]
- Confirmar com o dono do gateway apenas as duas extensões (Publicar, e talvez validação cross-scope). Nada de página pública (não há perfil/formulário público neste produto). [Source: Importantdoc.md#B6][Source: LOVEABLE-BRIEF.md#8]
- Isto fecha o épico E4 e alimenta o planejamento de esforço (o backend por-app é pequeno: 1 migration + costura + 1–2 extensões).

### Project Structure Notes

- Serve de "mapa de esforço" para priorização (matriz do mentalidadeauditoria §7): Publicar é P1 (bloqueia fluxo de produto), o resto é genérico.

### References

- [Source: Importantdoc.md#A3] — Cabe hoje vs precisa estender
- [Source: Importantdoc.md#B6] — Extensões (rotas explícitas)
- [Source: LOVEABLE-BRIEF.md#8] — Fora de escopo (sem realtime, full-text, upload)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
