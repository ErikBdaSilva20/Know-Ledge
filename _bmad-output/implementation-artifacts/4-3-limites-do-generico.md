---
baseline_commit: accddbf
---

# Story 4.3: Limites do modo genérico — o que NÃO precisa de backend novo (e o que precisaria)

Status: done

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

- [x] Task 1: Tabela "cabe no genérico" × tela (AC: #1, #4, #5)
- [x] Task 2: Tabela "exige extensão" com justificativa (AC: #2)
- [x] Task 3: Checklist negativo dos gatilhos de extensão que NÃO se aplicam (AC: #3, #6)

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

Claude Sonnet 5 (Amelia persona)

### Debug Log References

### Completion Notes List

- Confirmado por auditoria de código (não só por leitura do brief): Dashboard, Workspace, Busca, Grafo/Backlinks, Favoritos, Recentes e leitura da Base Compartilhada já rodam 100% sobre `db.table()` genérico (repos do Épico 1) — nenhum precisou de rota extra (AC#1).
- **Reavaliado à luz do Épico 3 e da implementação real (achado registrado na Story 4.1):** Publicar tecnicamente **cabe** no genérico dado o RBAC já implementado (visibilidade cross-owner pro manager já vem do `list`; `published_by` já é server-derived em qualquer `create`) — a extensão (`POST /shared/publish`) existe por **conveniência** (1 round-trip), não por necessidade estrutural. Atualizo o AC#2 com essa nuance em vez de reafirmar cegamente "exige extensão".
- Validação cross-scope de referências (Story 4.2) **não** virou rota — foi resolvida como validação inline no `POST /data/document_references` do mock-gateway, sem precisar de endpoint dedicado.
- Checklist negativo (AC#3, #6) confirmado por inspeção do produto: sem realtime, sem chat/WhatsApp, sem cron/jobs, sem webhook/pagamento, sem upload/mídia (ADR-004, markdown-only), sem página pública sem login. Nenhum gatilho de extensão de fundação se aplica.
- Recentes é estado local (`localStorage`, `knowledge/src/lib/recents.ts`) — confirmado, nunca tocou o banco (AC#4). Busca é só título, em memória (`search.tsx`) — confirmado (AC#5).
- **Conclusão do mapa de esforço:** o backend por-app real seria pequeno — 1 migration (Épico 2, pronta) + costura de dados (Épico 1, pronta) + no máximo 1 extensão realmente opcional (Publicar). Isso reduz a estimativa de esforço do que o rascunho original da story sugeria.

### File List

- (nenhum arquivo novo — conclusão apoiada no código dos Épicos 1-4 já entregue)
