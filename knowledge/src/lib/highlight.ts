// Syntax highlighting for fenced code blocks in rendered Markdown.
//
// highlight.js is imported from its /lib/core entry with an explicit, curated
// language set — NOT the full bundle — so we only ship grammars a knowledge
// base is likely to hold. Registration happens once at module load; the
// exported highlightCode() is called per code block by the marked renderer in
// markdown.tsx. It's synchronous, which is what lets the whole Markdown render
// stay a plain useMemo (no async/loading flash).

import hljs from "highlight.js/lib/core";

import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// Each grammar registers its own built-in aliases (ts, js, jsx, py, rs, sh…).
const LANGUAGES: Record<string, LanguageFn> = {
  bash,
  c,
  cpp,
  csharp,
  css,
  diff,
  dockerfile,
  go,
  ini,
  java,
  javascript,
  json,
  markdown,
  php,
  python,
  ruby,
  rust,
  sql,
  typescript,
  xml,
  yaml,
};

type LanguageFn = Parameters<typeof hljs.registerLanguage>[1];

for (const [name, fn] of Object.entries(LANGUAGES)) {
  hljs.registerLanguage(name, fn);
}

// Aliases the grammars don't ship themselves but people commonly write in a
// fence (```tsx, ```shell, ```toml…).
hljs.registerAliases(["tsx"], { languageName: "typescript" });
hljs.registerAliases(["shell", "console", "zsh"], { languageName: "bash" });
hljs.registerAliases(["html", "svg"], { languageName: "xml" });
hljs.registerAliases(["toml"], { languageName: "ini" });
hljs.registerAliases(["yml"], { languageName: "yaml" });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface HighlightResult {
  /** Sanitizable HTML for the code body (hljs token spans, or escaped plain text). */
  html: string;
  /** Resolved language name, or null when the fence had no known language. */
  language: string | null;
}

/**
 * Highlight one code block. Falls back to escaped plain text when the fence
 * language is missing or unknown — never throws, never auto-detects (detection
 * is slow and guesses wrong on short snippets). Output is HTML-escaped either
 * way, so it stays safe through the single DOMPurify pass in markdown.tsx.
 */
export function highlightCode(code: string, lang: string | undefined): HighlightResult {
  const language = lang?.trim().split(/\s+/)[0]?.toLowerCase() || "";
  if (language && hljs.getLanguage(language)) {
    try {
      const { value } = hljs.highlight(code, { language, ignoreIllegals: true });
      return { html: value, language };
    } catch {
      // fall through to plain rendering
    }
  }
  return { html: escapeHtml(code), language: null };
}
