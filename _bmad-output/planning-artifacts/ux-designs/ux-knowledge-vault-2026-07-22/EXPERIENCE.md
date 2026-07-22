---
name: Knowledge Vault
status: final
sources:
  - Codebase audit (knowledge/src) — AppShell.tsx, workspace.tsx/workspace-doc.tsx, shared.tsx/shared-doc.tsx, Editor.tsx, Explorer.tsx, FolderTree.tsx, admin.tsx, prose.css
updated: 2026-07-22
---

# Knowledge Vault — Responsive UX Audit & Fix Spine

> Retrofit pass on an existing, shipped product (not greenfield). Scope: mobile/tablet responsiveness, triggered by "não estamos conseguindo de jeito nenhum ler os documentos." Paired with `DESIGN.md` (no new visual identity — inherits the app's existing shadcn/Tailwind tokens as-is). `{path.to.token}` references resolve against `DESIGN.md`.

## Foundation

Single-surface responsive web (React + Tailwind v4 + shadcn/ui, `react-resizable-panels` not currently used in the reading surface). Three roles share one codebase and one set of screens — rep, manager, admin differ only in what's visible/editable (RBAC), never in layout. So a responsive fix made here fixes it for all three roles at once; there is no separate "mobile app" to build. `AppShell.tsx` already implements a correct desktop-sidebar/mobile-`Sheet` shell — this audit does not touch it. The defect lives one layer in, in the document-reading/editing surface (`Editor.tsx`) and the file browser (`Explorer.tsx`/`FolderTree.tsx`).

## Information Architecture

| Surface | Reached from | Mobile behavior today |
|---|---|---|
| Workspace (Explorer + doc) | Sidebar "Meu Workspace" | Correct master-detail collapse: `workspace.tsx` shows Explorer full-width until a doc is opened, then hides Explorer and shows the doc full-width (`hasDoc && "hidden md:block"` / `!hasDoc && "hidden md:flex"`). Not broken. |
| Base Compartilhada (Explorer + doc) | Sidebar "Base Compartilhada" | Same pattern, mirrored in `shared.tsx`. Not broken. |
| Document reading pane | Opening any doc, personal or shared | **Broken.** Both roles route through the same `Editor.tsx`; see Component Patterns. |
| Admin, Ajuda, Favoritos, Busca, Recentes | Sidebar | Left-aligned content, list-row layouts. Minor crowding risk under ~375px on the four list-row screens — Admin, Favoritos, Recentes, Busca (see Component Patterns' "Admin list rows" entry, which covers all four under one shared fix) — not a blocker. Ajuda is prose-only, no list rows, not at risk. |
| Grafo | Sidebar | Out of scope for this audit (already canvas/pan-zoom, handled in a prior pass). |

→ No new surfaces are added. This pass changes *behavior within* the existing Workspace/Base Compartilhada document pane, plus row-action reachability in Explorer/FolderTree.

## Voice and Tone

No microcopy changes in this pass. Existing strings ("Referenciado por", "Salvo às…", "Documento não encontrado") stay as-is; brand voice lives in `DESIGN.md` and is untouched.

## Component Patterns

Behavioral. Visual specs (spacing, sizing) reference `DESIGN.md.components` and `DESIGN.md.spacing`.

| Component | File | Today (evidenced) | Fix |
|---|---|---|---|
| Pane toggle (Markdown / Preview) | `Editor.tsx` `PaneToggle` | Icon-only below `sm:` already (`hidden sm:inline` on the label) — good bones, but the button itself is a `size="sm"` shadcn Button (~32px hit area). `showRaw` and `showPreview` **both default to `true`**, independently togglable at any viewport. Below `md:` the grid collapses to `grid-cols-1`, so both panes render **stacked**, not side-by-side. | Below `md:`, the two are **mutually exclusive** (radio-like, not two independent checkboxes): selecting one clears the other. Default state below `md:` is **Preview only** (`showRaw=false, showPreview=true`) — see `[ASSUMPTION]` in Key Flows. Hit area padded to `{spacing.touch-target-min}` (`min-h-11 min-w-11`) below `md:`; the visible icon stays its current small size. At `md:` and above, current independent-toggle, side-by-side behavior and button size are preserved unchanged. |
| Raw Markdown textarea | `Editor.tsx` ref callback (`el.style.height = Math.max(scrollHeight, parentH)`) | Auto-grows to fit **all of its content**, with no cap — on a long document this can be several thousand pixels tall. Combined with the stacking above, this is the actual mechanism of the "can't read anything" bug: the reader has to scroll past the entire raw source before reaching the rendered preview underneath it. It also has no accessible label — `placeholder` alone ("Escreva em Markdown…") is a weak fallback name for assistive tech, pre-existing but cheap to fix while the element is already being touched. | Below `md:`, cap the textarea to its container's height (`height: 100%`, own `overflow-y: auto`) instead of growing to `scrollHeight` — each pane scrolls internally and independently, never past the viewport. Desktop side-by-side behavior (both panes visible, natural height) is unaffected. Bundle in `aria-label="Markdown bruto"` alongside the height-cap edit. |
| Editor header toolbar | `Editor.tsx` top `flex flex-wrap` row | Title input (`text-xl sm:text-2xl`) + save status + save button (`size="sm"`, ~32px) + pane toggle all compete for one row. `flex-wrap` means it *survives* (no overflow), but on a ~360px phone it wraps to 2–3 short lines before any document content appears. | Title gets its own full-width row below `sm:`, set to `{typography.doc-title.fontSize}` (a defined mobile floor instead of the current bare `text-xl`); save-status/save-button/pane-toggle collapse onto a second row, icon-only (save status text already `hidden sm:inline` — extend the same treatment to the save button, and pad it to `{spacing.touch-target-min}` below `md:` same as the pane toggle). Net: 2 predictable rows instead of an unpredictable wrap. |
| Row actions — `Explorer.tsx:654` (`FolderMenu`: rename, delete, move) | `Explorer.tsx:654` | `<button className="opacity-0 group-hover:opacity-100">` wrapping a bare `MoreHorizontal` icon — invisible with no `:hover` on touch, **and** confirmed to have zero accessible name today (no `aria-label`, no `title`, no visually-hidden text — a real WCAG 4.1.2 failure independent of this audit). No `focus-within` fallback either. | Trigger is **always rendered**, `{components.row-action-trigger.restingOpacity}` (0.6) below `md:` / `(any-pointer: coarse)`, rising to full opacity on press/focus/hover — never `opacity-0`. Hit area padded to `{spacing.touch-target-min}`. Gains `aria-label="Mais ações"` (or per-item `"Ações de {itemName}"`) — stated here definitively, not deferred, since the missing label is already confirmed, not hypothetical. `focus-within:opacity-100` added so keyboard users don't depend on the new touch treatment either. |
| Row actions — `FolderTree.tsx:143` (read-only curation tree) | `FolderTree.tsx:143` | Different component from `Explorer.tsx`: this tree has no rename/drag/create, only a caller-supplied `docAction`/`folderAction` (in practice, a **Publish** button in Admin's vault view and Workspace's read-only index). Already has the `focus-within:opacity-100` escape hatch `Explorer.tsx` lacks. | **No behavior change** — this row exists to prevent the fix above from being misapplied here (no "Mover para…" entry belongs in a Publish-only tree). Only action item: confirm the Publish button itself carries a real accessible name (icon+label already visible in `PublishToSharedButton`, so likely already fine — verify, don't rebuild). |
| Move document between folders (drag-and-drop) | `Explorer.tsx` `draggable`/`onDragStart`/`onDrop` | Native HTML5 DnD — no touch equivalent, so this action is silently unavailable on phones/tablets (no error, no fallback, it just doesn't respond to a touch-drag gesture). | Add a tap-reachable fallback: a "Mover para…" entry in `Explorer.tsx:654`'s `FolderMenu` (the row above) opens a folder picker (`{components.move-doc-picker}`). Drag-and-drop stays as the desktop power-path; it stops being the *only* path. Picker's keyboard/focus semantics are specified in Accessibility Floor. |
| Admin list rows (docs/shared/users tabs) | `admin.tsx` | Icon + `truncate` title + fixed-width owner-name/role span + delete icon button, no wrap. Degrades but doesn't break — the `flex-1 truncate` title absorbs the squeeze. Same fixed-row crowding risk applies to the simpler list rows on Favoritos/Recentes/Busca (title + metadata in one un-wrapped flex row), just with less at stake since those rows carry one metadata field, not several. | Lower priority. Below `sm:`, drop the owner-name span (Admin) / metadata span (Favoritos, Recentes, Busca) to a second line under the title (`flex-col` instead of one `flex` row) so the title gets more room before truncating. One shared pattern, applied to all four screens' list rows. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Doc pane, `< md` | Editor | Exactly one of {Markdown, Preview} visible, default **Preview**. Toggling is instant, no scroll-position carry-over between panes (each starts scrolled to top). If focus was inside the pane being hidden (e.g. a wikilink `<Link>` in Preview), focus moves to the newly-shown pane's toggle button instead of falling through to `<body>` when React unmounts that subtree. |
| Doc pane pane-swap announcement | Editor | `role="status"` / `aria-live="polite"` region near the toggle announces "Mostrando: Preview" / "Mostrando: Markdown" on switch — protects a screen-reader user whose focus has moved into the pane content (not the toggle button) from a silent content swap under them. |
| Doc pane, `≥ md` | Editor | Unchanged: both visible side-by-side by default, independently toggleable, matches current desktop behavior. |
| Row actions (`Explorer.tsx:654`), `< md` or `(any-pointer: coarse)` | Explorer | Actions button always rendered at `{components.row-action-trigger.restingOpacity}` (0.6, never `0`); full opacity on press/focus/hover. `(any-pointer: coarse)` — not `(pointer: coarse)` — deliberately, so a hybrid touch+trackpad device (Surface/Chromebook-class) that reports `hover: hover` as its *primary* pointer still gets the always-visible treatment if a touchscreen is present at all. |
| Row actions (`Explorer.tsx:654`), `≥ md` with `(any-pointer: coarse)` **false** | Explorer | Hover-to-reveal, as today — this branch only applies to genuinely mouse/trackpad-only hardware, not "any viewport `≥ md`," to avoid silently resurrecting the hover-only bug on touch-capable laptops. |
| Row actions (`FolderTree.tsx:143`) | FolderTree | Unchanged at every breakpoint — different component, no rename/delete/move actions, existing `focus-within` reveal is already correct (see Component Patterns). |
| Move-doc fallback menu open | Explorer | Folder picker lists the same tree the drag-and-drop already targets — no new data model, just a tap-driven entry point to the existing move operation. Focus-trapped while open; see Accessibility Floor for full dialog semantics. |

## Interaction Primitives

**Touch and mouse both first-class** — Knowledge Vault has no keyboard-only or touch-only persona; a rep reading a shared policy doc is as likely to be on a phone as a manager curating vaults at a desk.

- Tap a pane-toggle icon (`< md`) — switches the single visible pane; the other's icon shows unpressed (`aria-pressed` already wired, keep it).
- Long-press is **not** used anywhere in this pass — no gesture that isn't also reachable by a plain tap, to avoid a hidden-affordance repeat of the hover-reveal bug this audit is fixing.
- Drag-and-drop (folder tree) stays as an enhancement, never the only way to complete "move a document."

**Banned by this spine:** any `opacity-0`/`hidden` affordance below `md:` that has no tap-reachable equivalent; any element whose mobile height is driven by its own content instead of its container; native-DnD-only actions with no fallback path.

## Accessibility Floor

Behavioral; contrast/color inherits shadcn defaults per `DESIGN.md`.

- Every icon-only control introduced or resized for mobile in this pass meets `{spacing.touch-target-min}` (44px) hit area, even where the visible icon stays small — pad the tap target, not the glyph. Applies concretely to: pane toggle, Editor save button, `Explorer.tsx:654` row-action trigger (see each row's Fix column in Component Patterns — this is not left as a general principle only).
- `PaneToggle`'s existing `aria-pressed` is correct and must be preserved through the mutual-exclusivity change (screen reader still hears "Preview, pressed" / "Markdown, not pressed").
- `Explorer.tsx:654`'s `FolderMenu` trigger gains `aria-label="Mais ações"` (or per-item `"Ações de {itemName}"`) — this is a confirmed missing-label bug today (verified by reading the code), stated here as a committed fix, not a maybe. `FolderTree.tsx:143`'s different, read-only tree needs no new label — only confirm its existing Publish button already has one.
- `focus-within` fallback (already on `FolderTree.tsx:143`) extends to `Explorer.tsx:654` regardless of the opacity fix above — keyboard users shouldn't depend on hover *or* on the new touch treatment to reach these actions.
- The move-doc folder picker (triggered from `Explorer.tsx:654`'s menu) follows standard dialog focus semantics: focus moves into the picker on open, `Escape` closes it, and focus returns to the triggering row's action button on close or selection — the same contract a keyboard-only or switch-access user needs for Flow 2 that Ana gets by touch.
- Known residual gap, not fully closeable within this scope: `(any-pointer: coarse)` (State Patterns) covers hybrid touch+trackpad hardware better than `(pointer: coarse)` alone, but no CSS media feature perfectly distinguishes "has a touchscreen" from "primary input is a mouse" on every device — treat this as a best-effort mitigation, not a guarantee, and re-test on real hybrid hardware before calling it closed.

## Responsive & Platform

| Breakpoint (Tailwind default) | Sidebar (`AppShell.tsx` — unchanged) | Workspace/Shared master-detail (unchanged) | Editor pane (this fix) |
|---|---|---|---|
| `< md` (< 768px) | Hidden; `Sheet` drawer via hamburger | Explorer *or* doc, never both, full-width | Exactly one pane, default Preview, internally scrolling, capped to viewport |
| `md`–`lg` (768–1023px) | Visible, collapsible to 40px icon rail | Explorer + doc side-by-side (280px/320px + 1fr) | Both panes side-by-side, independently toggleable (today's behavior) |
| `≥ lg` (1024px+) | Same as `md`, more breathing room | Same as `md` | Same as `md` |

Knowledge Vault is responsive web, not a native app — this pass makes the phone form factor a genuine reading/light-editing surface (the user's own framing: "pra gente ver o readme puro, e a versão formatada"), not a second-class fallback of the desktop layout.

## Inspiration & Anti-patterns

- **Matches an established pattern**, not invented here: single-pane-with-toggle document reading on mobile is how Obsidian, GitHub's mobile file view, and Notion's mobile page view all handle raw-vs-rendered — validates the user's own proposed direction rather than requiring new research.
- **Reuse, don't rebuild:** `PaneToggle` already has the right icon-only affordance and `aria-pressed` wiring — the fix is default state + mutual exclusivity + a height cap, not a new component.
- **Rejected — a separate `/m/` mobile route or mobile-only component tree:** one responsive surface, one codebase path, consistent with how `AppShell.tsx` already handles the sidebar. A parallel mobile implementation would double the maintenance surface for a fix that's really about three CSS/state decisions.
- **Rejected — long-press-to-reveal row actions:** trades one hidden affordance (hover) for another (long-press isn't discoverable either) — see Interaction Primitives.

## Key Flows

### Flow 1 — Ana reads a policy doc on her phone (Ana Silva, rep, on the shop floor between calls)

1. Ana taps the link a manager sent her to a doc in Base Compartilhada, opening it on her phone's browser.
2. **Today:** before she even gets to the content, the header itself wraps into three cramped lines — title, then save-status, then the pane toggle, none of them predictable — and below that, the raw Markdown pane sits on top: a monospace wall of `#`, `-`, and `[[links|id]]` syntax stretching far past the bottom of her screen. She scrolls, and scrolls, looking for the actual policy text, and gives up before reaching the rendered version underneath.
3. **Fixed:** the header resolves to two clean rows (title, then a compact icon-only toolbar) and the page shows exactly one pane below it — the rendered Preview, capped to her screen, scrolling only its own content. Headings, lists, and the policy text are readable immediately, no cramped header and no wall of syntax to get past.
4. She taps the small "Markdown" icon in the header out of curiosity, briefly sees the raw source (now also capped and independently scrollable), taps "Preview" again to go back.
5. **Climax:** She finds the one line she needed, screenshots it, and replies to the manager's message before her next call — the thing that was reportedly impossible ("não estamos conseguindo de jeito nenhum ler os documentos") just worked.

Failure: doc has no content yet (empty). Preview pane shows the existing empty state; no raw-pane wall to scroll through either, same fix applies.

### Flow 2 — Ana reorganizes two files from her phone (Ana Silva, rep, tidying up before a review)

1. Ana opens Meu Workspace on her phone. Explorer shows full-width (no doc open yet) — this part already works today.
2. She wants to rename a file and move another into a folder.
3. **Today:** she taps and holds near the row hoping for a menu; nothing appears — the rename/delete/menu button only exists on `:hover`, which her phone never fires. Drag-and-drop to move the other file also does nothing; native HTML5 drag has no touch handler.
4. **Fixed:** each row shows a persistent, tappable action button (no longer `opacity-0`-and-gone). She taps it, picks "Renomear," done. For the second file, the same menu now has "Mover para…", opening a small folder picker — she picks the target folder without needing to drag anything.
5. **Climax:** both edits land before her review starts, from her phone, with no desktop hand-off required.

Failure: folder picker shows an empty tree (no folders yet) → same empty-state treatment `FolderTree` already uses elsewhere, no new state to design.
