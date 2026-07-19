# Story 2.5: `types.gen.ts` batendo com o schema e o contrato dos repos

Status: ready-for-dev

## Story

As a **engenheiro garantindo type-safety na costura**,
I want **`types.gen.ts` refletir exatamente o schema e os repos tipados a partir dele**,
so that **um descompasso schema↔tipos não vire bug silencioso em runtime**.

## Acceptance Criteria

1. `types.gen.ts` (protegido) contém `Database['public']['Tables']['<tabela>']['Row'|'Insert'|'Update']` para todas as 6 tabelas, com **snake_case** e nullability idênticos ao schema. [Source: Importantdoc.md#B5][Source: Importantdoc.md#B10]
2. Cada repo importa seus tipos de `types.gen.ts` (ex.: `type Document = Database['public']['Tables']['document']['Row']`) — sem `any`, sem `as`. [Source: mentalidadeauditoria.md#6.2]
3. Campos setados pelo servidor (`id`, `owner_id`, `published_by`, `created_at`, `updated_at`) aparecem como **opcionais/omitidos no tipo `Insert`** dos repos — o front não os fornece. [Source: Importantdoc.md#B5]
4. Enums `target_scope`/`document_scope` são tipados como união literal `'personal' | 'shared'` (não `string`). [Source: mentalidadeauditoria.md#6.2]
5. Payloads que vêm do gateway são tratados como **não confiáveis** e validados no boundary (Zod/ArkType) antes de virar tipo (Story 6.1) — o tipo é a forma esperada, a validação garante em runtime. [Source: mentalidadeauditoria.md#6.2]
6. Uma verificação (`tsc --noEmit`) confirma zero erro e **zero imports não usados** (quebram o build). [Source: Importantdoc.md#B3][Source: Importantdoc.md#B10]

## Tasks / Subtasks

- [ ] Task 1: Especificar o shape de `types.gen.ts` por tabela (Row/Insert/Update) (AC: #1, #3, #4)
- [ ] Task 2: Definir como os repos derivam tipos e o padrão `Partial<Insert>` para create/update (AC: #2, #3)
- [ ] Task 3: Marcar o boundary de validação de payload de entrada (AC: #5) — linkar Story 6.1
- [ ] Task 4: Portão de qualidade `tsc --noEmit` + regra de imports não usados (AC: #6)

## Dev Notes

- `types.gen.ts` é **protegido** — gerado a partir do schema, não editado à mão. Ele "bate com o schema" é pré-requisito de publish. [Source: Importantdoc.md#B10]
- TypeScript **strict** com `noUnusedLocals`: import não usado **quebra o build**. [Source: Importantdoc.md#B3]
- Regra de ouro do domínio: **payloads de rede não são confiáveis implicitamente** — usar validação de schema (Zod/ArkType) no boundary. O tipo estático não substitui a validação em runtime. [Source: mentalidadeauditoria.md#6.2]
- Considerar **branded types** para `UserId`/`DocumentId` para não trocar um id por outro (nice-to-have de domínio). [Source: mentalidadeauditoria.md#6.2]

### Project Structure Notes

- `types.gen.ts` e `client.ts` protegidos; repos em `src/lib/data/*.repo.ts` (Story 1.5). Enums espelham os CHECKs do schema (Story 2.3).

### References

- [Source: Importantdoc.md#B5] — types.gen.ts e repos
- [Source: Importantdoc.md#B10] — types.gen.ts bate com o schema; build limpo
- [Source: mentalidadeauditoria.md#6.2] — Type safety, runtime validation, branded types

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
