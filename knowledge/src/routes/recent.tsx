import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDb } from "@/lib/useDb";
import { useGatewayList } from "@/lib/useGatewayList";
import { documentsRepo } from "@/lib/data/documents.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { getRecents, type RecentEntry } from "@/lib/recents";
import { Card } from "@/components/ui/card";
import { BookOpen, FileText } from "lucide-react";

export function RecentPage() {
  const mockDocuments = useDb((s) => s.documents);
  const mockShared = useDb((s) => s.shared_documents);
  const { data: documents } = useGatewayList(mockDocuments, documentsRepo.list);
  const { data: shared } = useGatewayList(mockShared, sharedDocumentsRepo.list);
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  useEffect(() => {
    const update = () => setRecents(getRecents());
    update();
    window.addEventListener("kv:recents-changed", update);
    return () => window.removeEventListener("kv:recents-changed", update);
  }, []);

  return (
    <div className="max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Recentes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Documentos abertos recentemente.</p>
      <Card className="mt-6">
        {recents.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhum documento recente.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recents.map((r) => {
              if (r.scope === "personal") {
                const d = documents.find((x) => x.id === r.id);
                if (!d) return null;
                return (
                  <li key={r.at + r.id}>
                    <Link
                      to={`/workspace/${d.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{d.title}</span>
                      <span className="shrink-0 text-[10px] uppercase text-muted-foreground">
                        pessoal
                      </span>
                    </Link>
                  </li>
                );
              }
              const s = shared.find((x) => x.id === r.id);
              if (!s) return null;
              return (
                <li key={r.at + r.id}>
                  <Link
                    to={`/shared/${s.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    <span className="shrink-0 text-[10px] uppercase text-muted-foreground">
                      compartilhado
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
