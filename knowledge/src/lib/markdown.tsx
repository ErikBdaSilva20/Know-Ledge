import { Marked, type Tokens } from "marked";
import DOMPurify from "dompurify";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { highlightCode } from "./highlight";
import type { Document, Scope, SharedDocument } from "./types";

const WIKI_LINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
// Anchored variant for the marked tokenizer — must match at the start of the
// remaining source, not anywhere in it.
const WIKI_LINK_AT_START = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

// Render a resolved (or unresolved) wiki link to an HTML string. Anchors carry
// a real href for a11y/middle-click plus data-wikilink-to for the delegated
// SPA click handler below; unresolved links render inert.
function renderWikiLink(
  link: WikiLink,
  personalDocs: Document[],
  sharedDocs: SharedDocument[],
  visiblePersonalIds: Set<string>,
): string {
  const resolved = resolveWikiLink(link, personalDocs, sharedDocs);
  const visible =
    !!resolved && (resolved.scope === "shared" || visiblePersonalIds.has(resolved.id));

  if (visible && resolved) {
    const to = resolved.scope === "shared" ? `/shared/${resolved.id}` : `/workspace/${resolved.id}`;
    const variant = resolved.scope === "shared" ? "shared" : "personal";
    const icon = resolved.scope === "shared" ? "◇" : "◆";
    return (
      `<a href="${to}" data-wikilink-to="${to}" class="kv-wikilink kv-wikilink--${variant}">` +
      `<span class="kv-wikilink__icon">${icon}</span>${escapeHtml(resolved.title)}</a>`
    );
  }
  return (
    `<span class="kv-wikilink kv-wikilink--missing" title="Documento não encontrado">` +
    `[[${escapeHtml(link.title)}]]</span>`
  );
}

export function MarkdownView({
  content,
  personalDocs,
  sharedDocs,
  visiblePersonalIds,
}: RenderProps) {
  const navigate = useNavigate();

  const html = useMemo(() => {
    // A fresh Marked instance (not the shared singleton) so the wiki-link
    // renderer can close over the current docs without mutating global state.
    const md = new Marked({ gfm: true, breaks: true });
    md.use({
      extensions: [
        {
          name: "wikilink",
          level: "inline",
          start(src: string) {
            const i = src.indexOf("[[");
            return i < 0 ? undefined : i;
          },
          tokenizer(src: string) {
            const m = WIKI_LINK_AT_START.exec(src);
            if (!m) return undefined;
            return {
              type: "wikilink",
              raw: m[0],
              title: m[1].trim(),
              id: m[2]?.trim(),
            };
          },
          renderer(token: Tokens.Generic) {
            return renderWikiLink(
              { title: token.title as string, id: token.id as string | undefined },
              personalDocs,
              sharedDocs,
              visiblePersonalIds,
            );
          },
        },
      ],
      renderer: {
        // Syntax-highlight fenced code blocks (see highlight.ts). The token
        // spans are HTML-escaped by highlight.js and re-sanitized below.
        code({ text, lang }: Tokens.Code) {
          const { html, language } = highlightCode(text, lang);
          const langClass = language ? ` language-${language}` : "";
          return `<pre><code class="hljs${langClass}">${html}</code></pre>`;
        },
      },
    });

    // Wrap GFM tables (which never nest) so wide ones scroll horizontally
    // instead of overflowing the pane — see .kv-table-scroll in prose.css.
    const parsed = (md.parse(content) as string)
      .replace(/<table>/g, '<div class="kv-table-scroll"><table>')
      .replace(/<\/table>/g, "</table></div>");

    // Story 6.7 — a shared document is read by users other than its author;
    // stored-XSS is the threat model. Sanitize once, at the presentation
    // boundary (no <script>, no on*=, no javascript: URLs).
    return DOMPurify.sanitize(parsed);
  }, [content, personalDocs, sharedDocs, visiblePersonalIds]);

  // Delegate clicks on rendered wiki links to the SPA router. Plain left-click
  // navigates in place; modifier/middle clicks fall through to the browser so
  // the real href still opens in a new tab.
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const anchor = (e.target as HTMLElement).closest?.("[data-wikilink-to]");
    const to = anchor?.getAttribute("data-wikilink-to");
    if (to) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <div
      className="prose markdown-body max-w-none"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
