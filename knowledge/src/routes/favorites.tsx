import { Link } from "react-router-dom";
import { useGatewayList } from "@/lib/useGatewayList";
import { useSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { BookOpen, FileText, Star } from "lucide-react";
import { documentsRepo } from "@/lib/data/documents.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { favoritesRepo } from "@/lib/data/favorites.repo";
import { handleDomainError } from "@/lib/handleError";
import { Button } from "@/components/ui/button";

export function FavoritesPage() {
  const { user } = useSession();
  const { data: allFavorites, refresh: refreshFavorites } = useGatewayList(favoritesRepo.list);
  const favorites = allFavorites.filter((f) => f.owner_id === user?.id);
  const { data: documents } = useGatewayList(documentsRepo.list);
  const { data: shared } = useGatewayList(sharedDocumentsRepo.list);

  return (
    <div className="max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Favoritos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Documentos que você marcou com estrela.</p>
      <Card className="mt-6">
        {favorites.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Você ainda não favoritou nenhum documento.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {favorites.map((f) => {
              if (f.document_scope === "personal") {
                const d = documents.find((x) => x.id === f.document_id);
                if (!d) return null;
                return (
                  <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Link
                      to={`/workspace/${d.id}`}
                      className="flex-1 truncate text-sm hover:underline"
                    >
                      {d.title}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        favoritesRepo.remove(f.id).then(refreshFavorites).catch(handleDomainError)
                      }
                    >
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    </Button>
                  </li>
                );
              }
              const s = shared.find((x) => x.id === f.document_id);
              if (!s) return null;
              return (
                <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Link to={`/shared/${s.id}`} className="flex-1 truncate text-sm hover:underline">
                    {s.title}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      favoritesRepo.remove(f.id).then(refreshFavorites).catch(handleDomainError)
                    }
                  >
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
