import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { documentsRepo } from "@/lib/data/documents.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { useGatewayList } from "@/lib/useGatewayList";
import { syncAllRefsFor } from "@/lib/syncRefs";
import { pushRecent } from "@/lib/recents";
import { MarkdownView } from "@/lib/markdown";
import { handleDomainError } from "@/lib/handleError";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { Document, Scope, SharedDocument } from "@/lib/types";
import { Code2, Eye, Save } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// Tailwind's `md` breakpoint (see tailwind config) — the same line where the
// pane grid below switches from stacked to side-by-side.
const DESKTOP_QUERY = "(min-width: 768px)";

interface Props {
  scope: Scope;
  id: string;
  readOnly?: boolean;
}

const AUTOSAVE_DEBOUNCE_MS = 5000;

interface PaneToggleProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title: string;
}

/**
 * Reusable pane visibility toggle (raw markdown / formatted preview).
 * `disabled` prevents hiding the last remaining pane. Hit area is padded to
 * the 44px touch-target floor below `md:`, where this is the only way to
 * reach the other pane (see EXPERIENCE.md § Component Patterns).
 */
const PaneToggle = forwardRef<HTMLButtonElement, PaneToggleProps>(function PaneToggle(
  { active, disabled, onClick, icon, label, title },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className="min-h-11 min-w-11 md:min-h-0 md:min-w-0"
    >
      <span className="sm:mr-1">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
});

export function Editor({ scope, id, readOnly }: Props) {
  // The generic gateway mode only supports list-then-find (Importantdoc.md §B5),
  // so load the scope's full list and pick this doc out of it; re-run when the
  // route's scope/id changes so switching documents shows the right one.
  const [doc, setDoc] = useState<Document | SharedDocument | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setDoc(undefined);
    const repo = scope === "personal" ? documentsRepo : sharedDocumentsRepo;
    repo.list().then((docs) => {
      if (!cancelled) setDoc(docs.find((d) => d.id === id));
    });
    return () => {
      cancelled = true;
    };
  }, [scope, id]);

  // A published shared document is an immutable snapshot — nobody edits it in
  // place, not even the original author (they edit the personal source and
  // re-publish). Enforce that here so the invariant holds regardless of what
  // any caller passes, not just at the SharedDoc call site.
  const isReadOnly = readOnly || scope === "shared";

  const [title, setTitle] = useState(doc?.title ?? "");
  const [content, setContent] = useState(doc?.content ?? "");
  const [dirty, setDirty] = useState(false);
  // Story 6.11 — the `updated_at` this editor last saw, sent back on the
  // next save so the gateway can 409 instead of overwriting a concurrent edit.
  const [lastKnownUpdatedAt, setLastKnownUpdatedAt] = useState<string | undefined>(doc?.updated_at);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  // Below md:, exactly one pane is ever shown (default Preview — the point is
  // reading, not the source) and the two toggles become mutually exclusive.
  // At md: and above, both start visible and toggle independently, unchanged
  // from before. See EXPERIENCE.md § Component Patterns / Responsive & Platform.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [showRaw, setShowRaw] = useState(isDesktop);
  const [showPreview, setShowPreview] = useState(true);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autoQuery, setAutoQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paneContentRef = useRef<HTMLDivElement>(null);
  const rawToggleRef = useRef<HTMLButtonElement>(null);
  const previewToggleRef = useRef<HTMLButtonElement>(null);
  // Set right before a pane swap if focus was inside the pane about to be
  // hidden — consumed by the effect below once the swap has committed, so
  // focus lands on the now-visible pane's toggle instead of dropping to
  // <body> when React unmounts the subtree that held it.
  const restoreFocusRef = useRef(false);

  // Full personal + shared lists power the wiki-link autocomplete and the
  // preview's link resolution (both scopes are always needed, regardless of
  // this editor's own `scope`).
  const { data: allPersonal } = useGatewayList(documentsRepo.list);
  const { data: allShared } = useGatewayList(sharedDocumentsRepo.list);

  useEffect(() => {
    if (!doc) return;
    setTitle(doc.title);
    setContent(doc.content);
    setDirty(false);
    setLastKnownUpdatedAt(doc.updated_at);
    pushRecent(scope, doc.id);
  }, [doc?.id]);

  // Shared by the debounced auto-save below and the manual "Salvar" button —
  // both just need to run the same save with whatever title/content/doc this
  // render closed over.
  const runSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const opts = { expectedUpdatedAt: lastKnownUpdatedAt };
      const saved =
        scope === "personal"
          ? await documentsRepo.update(doc.id, { title, content }, opts)
          : await sharedDocumentsRepo.update(doc.id, { title, content }, opts);
      // Best-effort: the document itself already saved successfully above,
      // so a ref-sync failure shouldn't flip `dirty` back on or block the
      // save indicator — just surface it and move on.
      syncAllRefsFor(scope, doc.id).catch(handleDomainError);
      setDirty(false);
      setSavedAt(new Date());
      setLastKnownUpdatedAt(saved.updated_at);
    } catch (err) {
      // Keep `dirty` true — the next edit (or a manual retry) re-triggers
      // this effect instead of silently losing the pending change. On a
      // 409 (someone else saved first) the toast from handleDomainError
      // is the only reaction today — no auto-merge (Story 6.11 AC#5 is
      // only partially satisfied: the user is warned, not offered a merge).
      handleDomainError(err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!dirty || !doc) return;
    // Debounced 5s after the last keystroke — avoids a network save on every
    // character while the user is still actively typing.
    saveTimeoutRef.current = setTimeout(runSave, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [dirty, title, content, doc?.id, scope, lastKnownUpdatedAt]);

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    runSave();
  };

  const visiblePersonalIds = useMemo(() => new Set(allPersonal.map((d) => d.id)), [allPersonal]);

  const autocompleteMatches = useMemo(() => {
    if (!showAutocomplete) return [];
    const q = autoQuery.toLowerCase();
    const all: Array<{ scope: Scope; title: string; id: string }> = [
      ...allShared.map((s) => ({ scope: "shared" as Scope, title: s.title, id: s.id })),
      ...allPersonal.map((d) => ({ scope: "personal" as Scope, title: d.title, id: d.id })),
    ];
    return all.filter((x) => x.title.toLowerCase().includes(q)).slice(0, 8);
  }, [showAutocomplete, autoQuery, allShared, allPersonal]);

  // Below md:, picking a pane hides the other one outright (radio-like); at
  // md: and up, the two toggle independently as before. Either way, if focus
  // was inside the pane about to disappear, restoreFocusRef flags the effect
  // below to move it to the newly-shown pane's toggle once React commits the
  // swap, instead of letting it drop to <body>.
  const selectPane = (pane: "raw" | "preview") => {
    if (paneContentRef.current?.contains(document.activeElement)) {
      restoreFocusRef.current = true;
    }
    if (!isDesktop) {
      setShowRaw(pane === "raw");
      setShowPreview(pane === "preview");
      return;
    }
    if (pane === "raw") setShowRaw((v) => !v);
    else setShowPreview((v) => !v);
  };

  useEffect(() => {
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    (showRaw ? rawToggleRef : previewToggleRef).current?.focus();
  }, [showRaw, showPreview]);

  // selectPane only enforces exclusivity at click time — an editor already
  // open with both panes shown (the desktop default) doesn't get that
  // treatment just by the window crossing below md:, e.g. a browser resize.
  // Without this, the original bug (both panes stacked, unbounded raw pane
  // on top) comes back through resize instead of through fresh load.
  useEffect(() => {
    if (!isDesktop && showRaw && showPreview) {
      setShowRaw(false);
      setShowPreview(true);
    }
  }, [isDesktop, showRaw, showPreview]);

  if (!doc) return <div className="p-10 text-muted-foreground">Documento não encontrado.</div>;

  // Guard: never hide the last remaining pane (desktop only — below md: the
  // two panes are mutually exclusive by construction, see selectPane above).
  const bothVisible = showRaw && showPreview;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setContent(v);
    setDirty(true);

    const pos = e.target.selectionStart;
    const before = v.slice(0, pos);
    const m = before.match(/\[\[([^[\]\n]*)$/);
    if (m) {
      setShowAutocomplete(true);
      setAutoQuery(m[1]);
    } else {
      setShowAutocomplete(false);
    }
  };

  const insertLink = (match: { title: string; id: string }) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = content.slice(0, pos);
    const m = before.match(/\[\[([^[\]\n]*)$/);
    if (!m) return;
    const start = pos - m[0].length;
    // Embed the id (ADR-001): resolution stays correct even if the target is renamed later.
    const inserted = `[[${match.title}|${match.id}]]`;
    const newContent = content.slice(0, start) + inserted + content.slice(pos);
    setContent(newContent);
    setDirty(true);
    setShowAutocomplete(false);
    setTimeout(() => {
      ta.focus();
      const newPos = start + inserted.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Own row for the title below sm: (a ~360px phone doesn't have room to
          share a row with save state + the pane toggle without wrapping
          unpredictably); back to one row, vertically centered, at sm:+. */}
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <input
          value={title}
          disabled={isReadOnly}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          className="min-w-0 bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground sm:flex-1 sm:text-2xl"
          placeholder="Sem título"
        />
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          {dirty ? (
            <span className="flex items-center gap-1">
              <Save className="h-3 w-3 animate-pulse" /> Salvando…
            </span>
          ) : savedAt ? (
            <span className="hidden sm:inline">Salvo às {savedAt.toLocaleTimeString()}</span>
          ) : (
            <span className="hidden sm:inline">Salvo</span>
          )}
          {!isReadOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSave}
              disabled={!dirty || saving}
              title="Salvar agora"
              className="min-h-11 min-w-11 md:min-h-0 md:min-w-0"
            >
              <Save className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
          )}
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <PaneToggle
              ref={rawToggleRef}
              active={showRaw}
              disabled={isDesktop && showRaw && !showPreview}
              onClick={() => selectPane("raw")}
              icon={<Code2 className="h-3.5 w-3.5" />}
              label="Markdown"
              title={showRaw ? "Ocultar markdown" : "Mostrar markdown"}
            />
            <PaneToggle
              ref={previewToggleRef}
              active={showPreview}
              disabled={isDesktop && showPreview && !showRaw}
              onClick={() => selectPane("preview")}
              icon={<Eye className="h-3.5 w-3.5" />}
              label="Preview"
              title={showPreview ? "Ocultar preview" : "Mostrar preview"}
            />
          </div>
          {/* Screen-reader-only: sighted users can already see which pane is
              showing, but a screen-reader user whose focus stayed in the
              content (not on the toggle) needs the swap announced. */}
          <span role="status" aria-live="polite" className="sr-only">
            {!isDesktop && (showRaw ? "Mostrando: Markdown" : "Mostrando: Preview")}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          ref={paneContentRef}
          className={cn(
            "grid min-h-full",
            bothVisible ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
          )}
        >
          {showRaw && (
            <div className={cn("relative", showPreview && "border-r border-border")}>
              <textarea
                value={content}
                readOnly={isReadOnly}
                onChange={handleContentChange}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                placeholder="Escreva em Markdown… use [[ para linkar outros documentos"
                aria-label="Markdown bruto"
                rows={1}
                ref={(el) => {
                  textareaRef.current = el;
                  if (el) {
                    el.style.height = "auto";
                    // The height floor only exists to keep this pane visually
                    // level with Preview when they sit side-by-side; alone
                    // (mobile, single pane) it would just force an oversized
                    // box on short documents, so it only applies at md:+.
                    const parentH = isDesktop ? (el.parentElement?.clientHeight ?? 0) : 0;
                    el.style.height = `${Math.max(el.scrollHeight, parentH)}px`;
                  }
                }}
                className="block w-full resize-none bg-transparent px-6 py-6 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              />
              {showAutocomplete && autocompleteMatches.length > 0 && (
                <div className="absolute left-6 top-6 z-10 w-80 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                  <div className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Referenciar documento
                  </div>
                  {autocompleteMatches.map((m, i) => (
                    <button
                      key={`${m.scope}:${m.id}:${i}`}
                      onClick={() => insertLink(m)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="text-muted-foreground">
                        {m.scope === "shared" ? "◇" : "◆"}
                      </span>
                      <span className="flex-1 truncate">{m.title}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">{m.scope}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {showPreview && (
            <div className="bg-background px-6 py-6">
              <MarkdownView
                content={content}
                personalDocs={allPersonal}
                sharedDocs={allShared}
                visiblePersonalIds={visiblePersonalIds}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
