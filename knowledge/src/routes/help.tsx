import { MarkdownView } from "@/lib/markdown";
import { useSession } from "@/lib/session";
import type { Document, SharedDocument } from "@/lib/types";
import visaoGeral from "@/content/ajuda/01-visao-geral.md?raw";
import guiaDetalhado from "@/content/ajuda/02-guia-detalhado.md?raw";
import referencias from "@/content/ajuda/03-referencias.md?raw";
import paraGestores from "@/content/ajuda/04-para-gestores.md?raw";

// The help text never links to a user's documents, so wiki-link resolution gets
// empty inputs. Module-level constants keep MarkdownView's memo stable.
const NO_DOCS: Document[] = [];
const NO_SHARED: SharedDocument[] = [];
const NO_IDS = new Set<string>();

const BASE_PARTS = [
  { id: "visao-geral", label: "1 · Como usar", content: visaoGeral },
  { id: "guia-detalhado", label: "2 · Guia detalhado", content: guiaDetalhado },
  { id: "referencias", label: "3 · Referências", content: referencias },
];
// Manager/admin-only content — hidden from reps, who can neither publish nor
// reach the Administração area.
const MANAGER_PART = { id: "para-gestores", label: "4 · Para gestores", content: paraGestores };

export function HelpPage() {
  const { can } = useSession();
  const PARTS = can("publishShared") ? [...BASE_PARTS, MANAGER_PART] : BASE_PARTS;

  return (
    <div className="max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Ajuda</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Como usar o Knowledge Vault — visão geral, guia detalhado e referências entre documentos.
      </p>

      <div className="mt-8 flex gap-10">
        <nav className="sticky top-6 hidden h-max w-48 shrink-0 lg:block">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nesta página
          </p>
          <ul className="border-l border-border">
            {PARTS.map((p) => (
              <li key={p.id}>
                <a
                  href={`#${p.id}`}
                  className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-14">
          {PARTS.map((p) => (
            <section key={p.id} id={p.id} className="scroll-mt-6">
              <MarkdownView
                content={p.content}
                personalDocs={NO_DOCS}
                sharedDocs={NO_SHARED}
                visiblePersonalIds={NO_IDS}
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
