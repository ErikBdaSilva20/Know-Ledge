import { useState } from "react";
import { Link } from "react-router-dom";
import { useGatewayList } from "@/lib/useGatewayList";
import { documentsRepo } from "@/lib/data/documents.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { documentReferencesRepo } from "@/lib/data/documentReferences.repo";
import { sharedDocumentReferencesRepo } from "@/lib/data/sharedDocumentReferences.repo";
import { computeBacklinks } from "@/lib/backlinks";
import type { Scope } from "@/lib/types";
import { ChevronDown, ChevronRight, CornerDownRight, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders a collapsible panel of "referenced by" documents at the TOP of a doc.
 * When expanded, it floats over the document content with a positive z-index
 * and caps its own height so thousands of references don't blow up the layout.
 */
export function Backlinks({ scope, id }: { scope: Scope; id: string }) {
  const { data: documents } = useGatewayList(documentsRepo.list);
  const { data: sharedDocuments } = useGatewayList(sharedDocumentsRepo.list);
  const { data: documentReferences } = useGatewayList(documentReferencesRepo.list);
  const { data: sharedDocumentReferences } = useGatewayList(sharedDocumentReferencesRepo.list);
  const backlinks = computeBacklinks(
    {
      documents,
      shared_documents: sharedDocuments,
      document_references: documentReferences,
      shared_document_references: sharedDocumentReferences,
    },
    scope,
    id,
  );
  const [open, setOpen] = useState(false);
  const count = backlinks.length;

  return (
    <div className="relative z-30 border-b border-border bg-muted/40">
      <button
        type="button"
        onClick={() => count > 0 && setOpen((v) => !v)}
        disabled={count === 0}
        className={cn(
          "flex w-full items-center gap-2 px-6 py-2 text-xs text-muted-foreground transition-colors",
          count > 0 && "cursor-pointer hover:bg-accent",
          count === 0 && "cursor-default",
        )}
        aria-expanded={open}
      >
        {count > 0 ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        <span className="font-semibold uppercase tracking-wider">Referenciado por</span>
        <span
          className={cn(
            "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
            count > 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
        {count === 0 && (
          <span className="ml-1 normal-case tracking-normal">
            Nenhum documento referencia este ainda.
          </span>
        )}
      </button>

      {open && count > 0 && (
        <div
          className={cn(
            // Overlay on top of the doc content, but scoped to the doc column width.
            "absolute inset-x-0 top-full z-40 max-h-[50vh] overflow-y-auto",
            "border-b border-border bg-popover shadow-lg",
          )}
        >
          <ul className="flex flex-wrap gap-2 p-3">
            {backlinks.map((b) => (
              <li key={`${b.scope}:${b.id}`}>
                <Link
                  to={b.scope === "shared" ? `/shared/${b.id}` : `/workspace/${b.id}`}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                >
                  <CornerDownRight className="h-3 w-3 text-muted-foreground" />
                  {b.title}
                  <span className="ml-1 text-[9px] uppercase text-muted-foreground">{b.scope}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
