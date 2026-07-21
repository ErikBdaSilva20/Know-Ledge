import { useEffect, useMemo, useRef, useState } from "react";
import { useDb } from "@/lib/useDb";
import { documentsRepo } from "@/lib/data/documents.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { isGatewayMode } from "@/lib/data/dataSource";
import { syncAllRefsFor } from "@/lib/syncRefs";
import { pushRecent } from "@/lib/recents";
import { MarkdownView } from "@/lib/markdown";
import { handleDomainError } from "@/lib/handleError";
import type { Document, Scope, SharedDocument } from "@/lib/types";
import { Code2, Eye, Save } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Props {
  scope: Scope;
  id: string;
  readOnly?: boolean;
}

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
 * `disabled` prevents hiding the last remaining pane.
 */
function PaneToggle({ active, disabled, onClick, icon, label, title }: PaneToggleProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
    >
      <span className="sm:mr-1">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function Editor({ scope, id, readOnly }: Props) {
  const mockPersonal = useDb((s) => s.documents.find((d) => d.id === id));
  const mockShared = useDb((s) => s.shared_documents.find((s) => s.id === id));

  // useDb only ever reflects the local mock store — in gateway mode it's never
  // repopulated from the backend, so `doc` was always undefined and every
  // document (even one just created successfully) rendered as "not found".
  // Fetch straight from the repo instead, mirroring Explorer.tsx's fix.
  const [gatewayDoc, setGatewayDoc] = useState<Document | SharedDocument | undefined>(undefined);

  useEffect(() => {
    if (!isGatewayMode()) return;
    let cancelled = false;
    setGatewayDoc(undefined);
    const repo = scope === "personal" ? documentsRepo : sharedDocumentsRepo;
    repo.list().then((docs) => {
      if (!cancelled) setGatewayDoc(docs.find((d) => d.id === id));
    });
    return () => {
      cancelled = true;
    };
  }, [scope, id]);

  const doc = isGatewayMode() ? gatewayDoc : scope === "personal" ? mockPersonal : mockShared;

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
  const [showRaw, setShowRaw] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autoQuery, setAutoQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allPersonal = useDb((s) => s.documents);
  const allShared = useDb((s) => s.shared_documents);

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
    saveTimeoutRef.current = setTimeout(runSave, 500);
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

  if (!doc) return <div className="p-10 text-muted-foreground">Documento não encontrado.</div>;

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

  // Guard: never hide the last remaining pane.
  const bothVisible = showRaw && showPreview;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <input
          value={title}
          disabled={isReadOnly}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          className="min-w-0 flex-1 bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground sm:text-2xl"
          placeholder="Sem título"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            >
              <Save className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
          )}
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <PaneToggle
              active={showRaw}
              disabled={showRaw && !showPreview}
              onClick={() => setShowRaw((v) => !v)}
              icon={<Code2 className="h-3.5 w-3.5" />}
              label="Markdown"
              title={showRaw ? "Ocultar markdown" : "Mostrar markdown"}
            />
            <PaneToggle
              active={showPreview}
              disabled={showPreview && !showRaw}
              onClick={() => setShowPreview((v) => !v)}
              icon={<Eye className="h-3.5 w-3.5" />}
              label="Preview"
              title={showPreview ? "Ocultar preview" : "Mostrar preview"}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
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
                rows={1}
                ref={(el) => {
                  textareaRef.current = el;
                  if (el) {
                    el.style.height = "auto";
                    const parentH = el.parentElement?.clientHeight ?? 0;
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
