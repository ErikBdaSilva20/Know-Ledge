# Story 1.4: Manifest `masi.template.json` e papéis Better-Auth

Status: ready-for-dev

## Story

As a **engenheiro registrando o Knowledge Vault na fundação**,
I want **o manifest do template e o modelo de papéis definidos corretamente**,
so that **o provisionamento, a edição por IA e o RBAC funcionem sem 403 nem ENOENT**.

## Acceptance Criteria

1. O `masi.template.json` é definido com: `engine: "vite-react-gateway"`, `envContract: ["VITE_GATEWAY_URL"]`, `schemaVersion`, `migrations`, `auth.roles: ["admin","manager","rep"]`, `screens[]` e `composio.toolkits: []`. [Source: Importantdoc.md#B7]
2. O bloco `editable.allow` inclui `src/screens/**`, `src/components/**`, `src/lib/data/*.repo.ts`, `src/lib/format.ts`, `src/app.css` (ou equivalente Tailwind). O bloco `protect` inclui `src/lib/data/client.ts`, `src/lib/data/types.gen.ts`, `src/components/registry.tsx`, `src/main.tsx`, `supabase/migrations/**` + protegidos do scaffold wiki. [Source: Importantdoc.md#B7]
3. Os papéis são **admin / manager / rep** (+ owner = criador). Está documentado que **o 1º usuário do tenant vira admin** e os demais entram como **rep** (automático). [Source: Importantdoc.md#B8]
4. Está documentado que **login/cadastro são do Better-Auth no gateway** (`auth.signIn/signUp/signOut`) — nunca implementar auth próprio. [Source: Importantdoc.md#B3][Source: Importantdoc.md#B8]
5. `composio.toolkits` é `[]` (o Knowledge Vault não integra Gmail/Slack/Notion nesta fase). [Source: Importantdoc.md#B7][Source: LOVEABLE-BRIEF.md#8]
6. A tela de "seletor de papel" do mock (`LOVEABLE-BRIEF §4`) é marcada como **substituível** por `auth.me()` real na costura (Story 1.6) — o papel real vem do gateway.

## Tasks / Subtasks

- [ ] Task 1: Redigir o `masi.template.json` do Knowledge Vault (AC: #1, #2, #5)
  - [ ] Subtask 1.1: `screens[]` cobrindo Dashboard, Workspace, Base Compartilhada, Busca, Grafo, Favoritos, Recentes, Admin [Source: LOVEABLE-BRIEF.md#5]
  - [ ] Subtask 1.2: `migrations: ["0001_business_schema.sql"]`
- [ ] Task 2: Documentar o modelo de papéis e o "1º user = admin" (AC: #3, #4)
- [ ] Task 3: Marcar o seletor de papel mock como ponto de troca para `auth.me()` (AC: #6)

## Dev Notes

- Papéis do produto batem 1:1 com os da fundação: **Rep** = membro comum (só os próprios docs), **Manager** = vê/edita tudo + publica na base compartilhada, **Admin** = tudo do manager + gestão de usuários. [Source: LOVEABLE-BRIEF.md#4]
- `src/lib/auth.tsx` lê sessão + papel via `auth.me()` → `{ user, role }`. **`role` serve só para UI** (esconder botões); a segurança real é no gateway (Story 3.2). [Source: Importantdoc.md#B8]
- Gestão de usuários no produto é **só visualização** (sem CRUD de usuário — isso é do Better-Auth). [Source: LOVEABLE-BRIEF.md#5.9]

### Project Structure Notes

- **Atenção ao glob:** `editable.allow` usa `src/lib/data/*.repo.ts` (raso). Como a camada de dados foi decidida na **raiz** de `src/lib/data/` (não em subpasta), o glob atual já cobre os repos. Ver Story 1.5.

### References

- [Source: Importantdoc.md#B7] — Manifest masi.template.json
- [Source: Importantdoc.md#B8] — Auth & papéis
- [Source: LOVEABLE-BRIEF.md#4] — Papéis de usuário
- [Source: LOVEABLE-BRIEF.md#5.9] — Administração (só visualização de usuários)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
