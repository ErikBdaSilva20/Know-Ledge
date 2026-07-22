import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDb } from "@/lib/useDb";
import { useGatewayList } from "@/lib/useGatewayList";
import { documentsRepo } from "@/lib/data/documents.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { foldersRepo } from "@/lib/data/folders.repo";
import { useSession } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { BookOpen, FileText, Folder as FolderIcon, Search as SearchIcon } from "lucide-react";

export function SearchPage() {
  const { user, can } = useSession();
  const mockDocuments = useDb((s) => s.documents);
  const mockShared = useDb((s) => s.shared_documents);
  const mockFolders = useDb((s) => s.folders);
  const { data: documents } = useGatewayList(mockDocuments, documentsRepo.list);
  const { data: shared } = useGatewayList(mockShared, sharedDocumentsRepo.list);
  const { data: folders } = useGatewayList(mockFolders, foldersRepo.list);
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return { personal: [], shared: [], folders: [] };
    const visiblePersonal = can("seeAllDocs")
      ? documents
      : documents.filter((d) => d.owner_id === user?.id);
    const visibleFolders = can("seeAllDocs")
      ? folders
      : folders.filter((f) => f.owner_id === user?.id);
    return {
      personal: visiblePersonal.filter((d) => d.title.toLowerCase().includes(query)).slice(0, 30),
      shared: shared.filter((d) => d.title.toLowerCase().includes(query)).slice(0, 30),
      folders: visibleFolders.filter((f) => f.name.toLowerCase().includes(query)).slice(0, 30),
    };
  }, [query, documents, shared, folders, can, user?.id]);

  return (
    <div className="max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título de documentos e pastas…"
            className="h-12 pl-10 text-base"
          />
        </div>
      </div>

      {!query ? (
        <p className="text-sm text-muted-foreground">
          Digite para buscar (busca por título apenas).
        </p>
      ) : (
        <div className="space-y-6">
          <Section title="Documentos pessoais" count={results.personal.length}>
            {results.personal.map((d) => (
              <Link
                key={d.id}
                to={`/workspace/${d.id}`}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{d.title}</span>
              </Link>
            ))}
          </Section>
          <Section title="Base Compartilhada" count={results.shared.length}>
            {results.shared.map((d) => (
              <Link
                key={d.id}
                to={`/shared/${d.id}`}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
              >
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{d.title}</span>
              </Link>
            ))}
          </Section>
          <Section title="Pastas" count={results.folders.length}>
            {results.folders.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded px-3 py-2 text-sm">
                <FolderIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{f.name}</span>
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title} <span className="text-muted-foreground/60">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="rounded border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          Nada encontrado.
        </p>
      ) : (
        <div className="rounded-md border border-border">{children}</div>
      )}
    </section>
  );
}
