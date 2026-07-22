---
name: Knowledge Vault
description: Inherits the existing shadcn/Tailwind v4 design system as-is — this pass adds no new visual identity, only responsive/behavioral deltas (see EXPERIENCE.md).
status: final
updated: 2026-07-22
colors:
  background: 'oklch(1 0 0)'
  foreground: 'oklch(0.129 0.042 264.695)'
  primary: 'oklch(0.208 0.042 265.755)'
  primary-foreground: 'oklch(0.984 0.003 247.858)'
  muted: 'oklch(0.968 0.007 247.896)'
  muted-foreground: 'oklch(0.554 0.046 257.417)'
  border: 'oklch(0.929 0.013 255.508)'
  destructive: 'oklch(0.577 0.245 27.325)'
  background-dark: 'oklch(0.14 0 0)'
  foreground-dark: 'oklch(0.985 0 0)'
  primary-dark: 'oklch(0.95 0 0)'
  primary-foreground-dark: 'oklch(0.14 0 0)'
  muted-dark: 'oklch(0.27 0 0)'
  muted-foreground-dark: 'oklch(0.7 0 0)'
  border-dark: 'oklch(1 0 0 / 12%)'
  destructive-dark: 'oklch(0.6 0.15 25)'
typography:
  body:
    fontFamily: 'ui-sans-serif, -apple-system, "Segoe UI", Inter, Roboto, sans-serif'
    fontSize: '0.975rem'
    lineHeight: '1.75'
  doc-title:
    fontSize: '1.25rem'
    fontSizeDesktop: '1.5rem'
    fontWeight: '600'
rounded:
  sm: 'calc(0.625rem - 4px)'
  md: 'calc(0.625rem - 2px)'
  lg: '0.625rem'
  DEFAULT: '0.625rem'
spacing:
  page-x-mobile: '1rem'
  page-x-desktop: '2rem'
  page-y-mobile: '1.5rem'
  page-y-desktop: '2.5rem'
  touch-target-min: '2.75rem'
components:
  pane-toggle:
    iconSize: '0.875rem'
    minTouchTarget: '{spacing.touch-target-min}'
    labelVisibility: 'hidden below sm: — icon only'
  editor-toolbar:
    background: 'transparent'
    borderBottom: '1px solid {colors.border}'
    paddingXMobile: '{spacing.page-x-mobile}'
    paddingXDesktop: '1.5rem'
  row-action-trigger:
    icon: 'lucide MoreHorizontal, unchanged'
    minTouchTarget: '{spacing.touch-target-min}'
    restingOpacity: '0.6'
    activeOpacity: '1'
  raw-textarea:
    inherits: 'unchanged shadcn-less native textarea styling already in Editor.tsx — only height behavior changes (see EXPERIENCE.md)'
  move-doc-picker:
    inherits: 'shadcn Popover or Dialog (implementer choice) + existing FolderTree rendering, unchanged visual style'
---

## Brand & Style

Knowledge Vault reads as calm, editorial infrastructure — closer to a well-typeset internal wiki than a SaaS dashboard. Neutral oklch grayscale carries almost the entire UI; color is spent only where it means something (primary actions, the destructive red, chart hues reserved for the graph view). Nothing here changes in this pass — this document exists so EXPERIENCE.md's responsive deltas have real token names to point at, not because the brand needed rework.

## Colors

Untouched by this audit. `background` / `foreground` / `border` do the structural work; `primary` marks the one interactive accent (links, active nav, primary buttons); `muted` / `muted-foreground` carry secondary text and chrome; `destructive` is reserved for delete actions. Both `:root` and `.dark` sets already exist in `knowledge/src/styles.css` — nothing new is introduced here, the tokens above (now including every `-dark` counterpart) are a complete read-only mirror for cross-referencing.

## Typography

Body copy and the rendered-Markdown prose theme (`knowledge/src/styles/prose.css`) are unchanged and already solid: `overflow-wrap: break-word`, a 0.975rem/1.75 base rhythm, and a heading scale that holds up at any viewport width — this audit found no typography defect worth touching. The one addition is `doc-title`: the Editor's title `<input>` currently jumps straight from `text-xl` to `sm:text-2xl` with no step in between on very narrow phones (see EXPERIENCE.md § Responsive & Platform) — `doc-title.fontSize` documents the mobile floor so implementation has a named value to hit instead of eyeballing it.

## Layout & Spacing

The page-container convention already in use across Dashboard/Admin/Ajuda/Favoritos/Busca/Recentes — `px-4 py-6 sm:px-8 sm:py-10`, left-aligned (no `mx-auto`) — is the house rhythm and this pass doesn't touch it. `spacing.touch-target-min` (2.75rem / 44px) is new: it's the Apple HIG / WCAG 2.5.5-derived floor this audit applies to every icon-only control introduced or resized for mobile. Several existing icon buttons (`size="sm"` shadcn Buttons, ~2rem — the pane toggle and Editor save button; the row-action trigger has no size classes at all today) sit under this floor; EXPERIENCE.md's Component Patterns table commits each of the three to `min-h-11 min-w-11` below `md:` (glyph itself stays visually small — pad the tap target, not the icon).

## Components

- **`pane-toggle`** — the Markdown/Preview `PaneToggle` buttons in the Editor header. Icon-only below `sm:` today (unchanged); this pass adds the mobile touch-target padding above and the mutual-exclusivity *behavior* documented in EXPERIENCE.md (visual appearance of the button itself doesn't change, just which one can be active at once below `md:`).
- **`editor-toolbar`** — the flex-wrap row holding the title input, save state, and pane toggle. Below `sm:`, the title gets its own full-width line at `{typography.doc-title.fontSize}`; save-status/save-button/pane-toggle share a second row.
- **`row-action-trigger`** — the per-row kebab/icon button in `Explorer.tsx`'s file tree (rename/delete/move menu). `restingOpacity: 0.6` below `md:` (never `0`, so it's always visible, not just always in the DOM) rising to `activeOpacity: 1` on press/focus/hover. `FolderTree.tsx`'s read-only curation tree is a different component with no rename/delete/move actions — its existing `focus-within` reveal pattern is correct as-is and out of scope for this token.
- **`raw-textarea`** and **`move-doc-picker`** — no new visual spec; see frontmatter `inherits` notes. Behavior-only changes, detailed in EXPERIENCE.md.

## Do's and Don'ts

- **Do** keep the pane-toggle and any row-action control reachable by both tap and hover — a control that only appears on `:hover` does not exist on a touchscreen.
- **Do** cap any auto-growing element (textareas, panels) to the viewport, never to its own content — content height must never dictate a mobile layout's scroll length before the user has seen anything.
- **Don't** introduce new colors, radii, or type sizes to solve a responsive problem — every fix in this pass is layout/behavior, not visual identity. If a screen looks broken on mobile, the fix is Tailwind breakpoint logic and component state, not a new token.
- **Don't** rely on native HTML5 drag-and-drop (`draggable`/`onDragStart`/`onDrop`) as the only way to perform an action — it has no touch equivalent; anything drag-only needs a tap-accessible fallback (see EXPERIENCE.md § Interaction Primitives).
