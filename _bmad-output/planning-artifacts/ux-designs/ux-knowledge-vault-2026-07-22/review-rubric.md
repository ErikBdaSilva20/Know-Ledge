# Spine Pair Review — Knowledge Vault

## Overall verdict

A tight, well-scoped retrofit spine — every reported bug is real, every code citation spot-checked resolved exactly as claimed, and the "no new visual identity" discipline holds throughout. The pair's main weakness is that DESIGN.md's inheritance-by-reference stops one step short: two of its own frontmatter component tokens (`doc-title`, `editor-toolbar`) go uncited or under-explained, and four of EXPERIENCE.md's six Component Patterns rows (raw textarea, row actions, move-doc fallback, admin rows) have no DESIGN.md-side visual spec at all, not even an explicit "inherits X unchanged." One color-token set is genuinely incomplete against its own stated source of truth. None of this blocks a downstream consumer from building the right thing — the fixes are unambiguous in EXPERIENCE.md's prose — but it means DESIGN.md is not yet a complete resolve-target for every visual detail EXPERIENCE.md implies.

## 1. Flow coverage — adequate
Checked every row in EXPERIENCE.md's Component Patterns table against Key Flows 1–2 for a named-protagonist walkthrough or explicit "otherwise addressed" treatment.
### Findings
- **medium** The "Editor header toolbar" finding (title/save/toggle row wrapping to 2–3 lines on a ~360px phone) has no beat in either Key Flow — it's stated and fixed only inside its own Component Patterns row (`EXPERIENCE.md` lines 41, 94-102). Flow 1 narrates the raw-textarea/pane-stacking fix in detail but never shows Ana encountering (or the fix resolving) the header wrap, even though both bugs sit on the same screen in the same "can't read documents" incident. *Fix:* add one sentence to Flow 1 step 2/3 acknowledging the header wrap, or note explicitly why it's out of narrative scope.
- **low** The "Admin list rows" finding (owner-name/title crowding) has no Key Flow coverage. This is defensible — the row itself says "Lower priority... degrades but doesn't break" (`EXPERIENCE.md` line 44) — but it's the only finding in the table with neither a flow nor a State Patterns row backing it. *Fix:* none required; the inline de-prioritization is sufficient, flagging for visibility only.

## 2. Token completeness — thin
Extracted all 16 frontmatter tokens under `colors` plus the one `{path.to.token}` reference in EXPERIENCE.md prose (`{spacing.touch-target-min}`) and the three inside DESIGN.md's own `components` block. Cross-checked the color values against the actual source of truth, `knowledge/src/styles.css`.
### Findings
- **critical** DESIGN.md's `colors` block defines light-mode values for `primary-foreground`, `muted`, `muted-foreground`, and `destructive` but ships no `-dark` counterpart for any of the four (`DESIGN.md` lines 6-18), even though `styles.css` has a complete `.dark` value for all four (`--primary-foreground: oklch(0.14 0 0)`, `--muted: oklch(0.27 0 0)`, `--muted-foreground: oklch(0.7 0 0)`, `--destructive: oklch(0.6 0.15 25)` — `knowledge/src/styles.css` lines 111-120). The Colors section explicitly claims "Both `:root` and `.dark` sets already exist in `knowledge/src/styles.css`... the tokens above are a read-only mirror" (`DESIGN.md` line 57) — the mirror is incomplete against its own claim. *Fix:* add the four missing `-dark` tokens with the values above.
- **medium** `typography.doc-title` (`DESIGN.md` lines 24-27) was introduced specifically, per its own prose ("`doc-title.fontSize` documents the mobile floor so implementation has a named value to hit instead of eyeballing it" — `DESIGN.md` line 61), to serve the Editor header-toolbar fix — but EXPERIENCE.md's "Editor header toolbar" Component Patterns row never cites `{typography.doc-title}` by path; it only says "Title gets its own full-width row below `sm:`" (`EXPERIENCE.md` line 41). The token exists and resolves, but is orphaned from the one place that needed it. *Fix:* cite `{typography.doc-title.fontSize}` in that row's Fix column.

## 3. Component coverage — thin
Extracted every component named in EXPERIENCE.md's Component Patterns table (6 rows) and DESIGN.md's `components` frontmatter (2 entries: `pane-toggle`, `editor-toolbar`) and checked for a visual-spec counterpart in both directions.
### Findings
- **high** Four of six EXPERIENCE.md Component Patterns rows have zero DESIGN.md representation, frontmatter or prose: "Raw Markdown textarea," "Explorer / FolderTree row actions," "Move document between folders," and "Admin list rows" (`EXPERIENCE.md` lines 40, 42-44). None of these get even a one-line "inherits shadcn `X` unchanged" statement the way the reference examples handle inherited-as-is components (compare `design-example-shadcn.md`'s explicit "uses the following shadcn components as-is, unchanged" list). Two of the four introduce genuinely new interactive surfaces — the row-action kebab/icon button and the "Mover para…" folder-picker popover — with no named shadcn primitive attached anywhere in either document. *Fix:* add a short DESIGN.md Components note (even a single sentence) naming which shadcn primitives back the new row-action button and folder picker.
- **medium** The row-actions fix ("Actions button always rendered at reduced opacity") never states what "reduced" means as a number, in either `EXPERIENCE.md` (State Patterns, line 52; Component Patterns, line 42) or `DESIGN.md` (no `row-action` component entry exists to hold it). Every other magnitude in this pass (touch-target-min, doc-title size) is a real named value; this one is left to implementer judgment. *Fix:* add an opacity value (e.g. via a new `components.row-action.restingOpacity` token) or explicitly state it's an implementation-time call.

## 4. State coverage — adequate
Walked all six IA surfaces (Workspace, Base Compartilhada, Document reading pane, Admin/Ajuda/Favoritos/Busca/Recentes, Grafo) against the State Patterns table and Key Flow failure paths.
### Findings
- **low** The IA table flags "Minor crowding risk under ~375px" for Admin/Ajuda/Favoritos/Busca/Recentes (`EXPERIENCE.md` line 24), but no State Patterns row exists for it — the only resolution is the one-line "not a blocker" aside in the IA table and the separate Admin-list-rows Component Patterns fix, which covers Admin specifically but not Ajuda/Favoritos/Busca/Recentes. *Fix:* either fold Ajuda/Favoritos/Busca/Recentes into the Admin-rows fix explicitly, or state why they're excluded.

Empty/cold-load/offline/permission-denied states are correctly absent — this pass doesn't touch data-loading or auth, and the two states that do apply (empty doc, empty folder tree) are covered in the Key Flows' Failure paths (`EXPERIENCE.md` lines 102, 112), which is sufficient given the narrow retrofit scope.

## 5. Visual reference coverage — strong
`mockups/`, `wireframes/` directories do not exist under the workspace dir; `imports/` and `.working/` exist but are empty. Confirmed via directory listing. Neither DESIGN.md nor EXPERIENCE.md reference any mockup/wireframe/import path (no `→ Composition reference:` line, unlike the shadcn/mobile examples) — consistent with the documented fast-path, no-creative-tool-artifacts scope. No dangling references found.
### Findings
(none)

## 6. Bloat & overspecification — strong
No pixel specs duplicate token coverage, no source restatement, no prose where a table would serve better, no decorative narrative untied to a decision — both Key Flows' beats map directly onto specific bug/fix pairs from the Component Patterns table. The "Foundation" section's role-parity paragraph and the Responsive & Platform table's closing sentence are the only mildly narrative moments, and both tie back to a real scoping decision (one codebase, one fix serves all three roles).
### Findings
(none)

## 7. Inheritance discipline — adequate
`sources` frontmatter resolves — all eight cited files/paths exist (`AppShell.tsx`, `workspace.tsx`, `workspace-doc.tsx`, `shared.tsx`, `shared-doc.tsx`, `Editor.tsx`, `Explorer.tsx`, `FolderTree.tsx`, `admin.tsx`, `prose.css`). All three factual code citations spot-checked came back accurate: `Editor.tsx` lines 91-92 confirm `showRaw`/`showPreview` both default `true`; `Explorer.tsx:654` confirms `opacity-0 group-hover:opacity-100` with no `focus-within` fallback; `FolderTree.tsx:143` confirms the `focus-within:opacity-100` escape hatch exists there. `workspace.tsx`'s `hasDoc && "hidden md:block"` claim (line 21 of EXPERIENCE.md) also checked out exactly against `workspace.tsx` lines 8-21. The one EXPERIENCE.md token reference (`{spacing.touch-target-min}`) resolves cleanly to DESIGN.md.
### Findings
- **low** Component naming is close-but-not-identical across the pair: DESIGN.md's frontmatter keys (`pane-toggle`, `editor-toolbar`, kebab-case) versus EXPERIENCE.md's table names ("Pane toggle (Markdown / Preview)," "Editor header toolbar," Title Case prose). Not a resolution failure — a human reader maps them fine — but there's no path-style citation anywhere tying the two together explicitly (see Finding 2, medium, re: `doc-title`). *Fix:* not required; noted for consistency only. (The component-coverage gaps for the other four EXPERIENCE.md rows are the substantive version of this issue — see §3.)

## 8. Shape fit — adequate
DESIGN.md present sections (Brand & Style, Colors, Typography, Layout & Spacing, Do's and Don'ts) are in canonical order; `Elevation & Depth` and `Shapes` are correctly omitted (no shadow or radius decisions in this behavioral-only pass). EXPERIENCE.md has all eight required defaults plus both triggered optional sections (Responsive & Platform, Inspiration & Anti-patterns), in the canonical order matching the reference examples.
### Findings
- **medium** DESIGN.md omits the body `## Components` section entirely, even though its frontmatter defines two components (`pane-toggle`, `editor-toolbar`) with real token values. Every reference example that defines frontmatter component tokens (Drift, Linen & Logic) pairs them with a prose `## Components` section explaining anatomy/rationale; here that explanation is scattered thinly across Typography and Layout & Spacing prose instead (e.g., `editor-toolbar`'s `paddingXDesktop: '1.5rem'` value is never mentioned in prose anywhere). *Fix:* add a short `## Components` section (even 3-4 lines) naming `pane-toggle` and `editor-toolbar` explicitly and pointing at their frontmatter tokens — this would also be the natural home for the shadcn-inheritance statements flagged in §3.

## Mechanical notes

- **Frontmatter completeness:** both files' frontmatter carry all spec-required keys (DESIGN.md: `name`, `description`, `status`, `updated`, `colors`, `typography`, `rounded`, `spacing`, `components`; EXPERIENCE.md: `name`, `status`, `sources`, `updated`). No missing required keys.
- **No Mermaid diagrams** in either file — none needed for this scope.
- **No broken cross-refs:** the single `{path.to.token}` reference in EXPERIENCE.md prose and all three `{path.to.token}` references inside DESIGN.md's `components` block resolve correctly.
- **Naming:** component names are consistent-in-spirit but not string-identical between the two files (kebab-case frontmatter keys vs. Title Case table names) — see §7/§8 above; no case caused an actual resolution failure.
- **Source citations verified accurate** (4/4 spot-checked): `Editor.tsx` L91-92, L270 (`grid-cols-1 md:grid-cols-2`), L287 (`scrollHeight`/`parentH`); `Explorer.tsx:654`; `FolderTree.tsx:143`; `workspace.tsx` L8-21. All match the claims made in EXPERIENCE.md and `.memlog.md` exactly.
