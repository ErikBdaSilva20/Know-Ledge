# Story 7.4: Apontar o app ao gateway local via config (sem tocar em `client.ts`)

Status: ready-for-dev

## Story

As a **Erik conectando o app ao tenant-local**,
I want **configurar `VITE_GATEWAY_URL`/`?gw=&t=` para o gateway local sem editar arquivos protegidos**,
so that **o mesmo app rode contra mock, tenant-local ou gateway real só trocando config**.

## Acceptance Criteria

1. O app aponta ao gateway local via **`VITE_GATEWAY_URL=http://localhost:<porta>`** e o tenant via `?t=` ou `VITE_*`, respeitando a cadeia de resolução do `client.ts` (Story 1.3) — **sem editar `client.ts`** (protegido). [Source: Importantdoc.md#B5][Source: Importantdoc.md#B7]
2. A flag `VITE_DATA_SOURCE` (Story 1.6) alterna mock ↔ gateway; com `gateway`, os repos usam `db`/`auth` reais contra o tenant-local. [Source: LOVEABLE-BRIEF.md#2.2]
3. `credentials: 'include'` e `X-Tenant-Id` funcionam contra o localhost (CORS do gateway local permite a origem do dev server). [Source: Importantdoc.md#B5][Source: mentalidadeauditoria.md#5.6]
4. Está documentado que **não** se usa o branch PREVIEW/fixtures aqui — este é o fluxo real contra o tenant-local (o preview é só do editor Sandpack). [Source: Importantdoc.md#B5]
5. Um `.env.local` de exemplo (sem segredos) mostra a config de dev. [Source: mentalidadeauditoria.md#5.6]
6. Está registrado o cuidado de **CORS**: o gateway local deve permitir a origem do Vite dev server, mas o gateway de produção nunca usa wildcard `*`. [Source: mentalidadeauditoria.md#5.6]

## Tasks / Subtasks

- [ ] Task 1: Definir as variáveis de config para o tenant-local (AC: #1, #2)
- [ ] Task 2: Validar credentials/X-Tenant-Id/CORS contra localhost (AC: #3, #6)
- [ ] Task 3: Documentar a separação do branch PREVIEW (AC: #4)
- [ ] Task 4: Escrever `.env.local.example` (AC: #5)

## Dev Notes

- `client.ts` já lê `?gw=&t=` **ou** `VITE_*` **ou** globais de runtime — para dev, `VITE_GATEWAY_URL` + `?t=` é o caminho, **sem tocar no arquivo protegido**. [Source: Importantdoc.md#B5]
- **CORS:** cuidado clássico de auditoria — permitir a origem do dev server no gateway local, mas nunca `*` em produção. [Source: mentalidadeauditoria.md#5.6]
- Isto fecha a costura: com a Story 1.6 (mock→gateway) + esta config, o app fala com o tenant-local sem redesenho.

### Project Structure Notes

- `.env.local` (git-ignored) + `.env.local.example` comitado. `client.ts`/`vite.config.ts` permanecem protegidos.

### References

- [Source: Importantdoc.md#B5] — resolução de config do client.ts, credentials, X-Tenant-Id, preview
- [Source: Importantdoc.md#B7] — protegidos / envContract
- [Source: mentalidadeauditoria.md#5.6] — CORS

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
