import { marked } from "marked";
import DOMPurify from "dompurify";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Document, Scope, SharedDocument } from "./types";

marked.setOptions({ breaks: true, gfm: true });

const WIKI_LINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export interface WikiLink {
  title: string;
  /** Target document id, embedded as `[[Title|id]]`. Absent for links written before ADR-001's fix. */
  id?: string;
}

// Extract [[Title]] / [[Title|id]] wiki links from markdown content.
export function extractWikiLinks(content: string): WikiLink[] {
  const out: WikiLink[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(WIKI_LINK_RE);
  while ((m = re.exec(content))) {
    out.push({ title: m[1].trim(), id: m[2]?.trim() });
  }
  return out;
}

export interface ResolvedWikiLink {
  scope: Scope;
  id: string;
  title: string;
}

/**
 * Single source of truth for resolving a wiki link to its target document.
 * Prefers the embedded id (stable across renames — ADR-001); falls back to a
 * title match only for links written before ids were embedded. Used by both
 * the renderer (this file) and the reference-sync (syncRefs.ts) so the two
 * never disagree about what a link points to.
 */
export function resolveWikiLink(
  link: WikiLink,
  personalDocs: Document[],
  sharedDocs: SharedDocument[],
): ResolvedWikiLink | null {
  if (link.id) {
    const shared = sharedDocs.find((s) => s.id === link.id);
    if (shared) return { scope: "shared", id: shared.id, title: shared.title };
    const personal = personalDocs.find((d) => d.id === link.id);
    if (personal) return { scope: "personal", id: personal.id, title: personal.title };
    return null;
  }
  const shared = sharedDocs.find((s) => s.title.toLowerCase() === link.title.toLowerCase());
  if (shared) return { scope: "shared", id: shared.id, title: shared.title };
  const personal = personalDocs.find((d) => d.title.toLowerCase() === link.title.toLowerCase());
  if (personal) return { scope: "personal", id: personal.id, title: personal.title };
  return null;
}

interface RenderProps {
  content: string;
  personalDocs: Document[];
  sharedDocs: SharedDocument[];
  visiblePersonalIds: Set<string>;
}

export function MarkdownView({
  content,
  personalDocs,
  sharedDocs,
  visiblePersonalIds,
}: RenderProps) {
  // Split into segments: text and wiki links, so we can render Link components
  const segments = useMemo(() => {
    const parts: Array<{ type: "text"; value: string } | { type: "link"; link: WikiLink }> = [];
    const re = new RegExp(WIKI_LINK_RE);
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (m.index > last) parts.push({ type: "text", value: content.slice(last, m.index) });
      parts.push({ type: "link", link: { title: m[1].trim(), id: m[2]?.trim() } });
      last = m.index + m[0].length;
    }
    if (last < content.length) parts.push({ type: "text", value: content.slice(last) });
    return parts;
  }, [content]);

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          // Story 6.7 — a shared document is read by users other than its
          // author; stored-XSS is the threat model. marked() never
          // interprets Markdown as trusted HTML, so every render is
          // sanitized (no <script>, no on*=, no javascript: URLs) here at
          // the presentation boundary, not "fixed" server-side.
          const html = DOMPurify.sanitize(marked.parse(seg.value) as string);
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        const resolved = resolveWikiLink(seg.link, personalDocs, sharedDocs);
        const visible =
          resolved && (resolved.scope === "shared" || visiblePersonalIds.has(resolved.id));

        if (visible && resolved!.scope === "shared") {
          return (
            <Link
              key={i}
              to={`/shared/${resolved!.id}`}
              className="mx-0.5 inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-sm font-medium text-accent-foreground hover:bg-accent/80"
            >
              <span className="text-muted-foreground">◇</span>
              {resolved!.title}
            </Link>
          );
        }
        if (visible && resolved!.scope === "personal") {
          return (
            <Link
              key={i}
              to={`/workspace/${resolved!.id}`}
              className="mx-0.5 inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary hover:bg-primary/20"
            >
              <span className="text-muted-foreground">◆</span>
              {resolved!.title}
            </Link>
          );
        }
        return (
          <span
            key={i}
            className="mx-0.5 inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-sm text-destructive"
            title="Documento não encontrado"
          >
            [[{seg.link.title}]]
          </span>
        );
      })}
    </div>
  );
}
