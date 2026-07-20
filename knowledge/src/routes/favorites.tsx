import { Link } from "react-router-dom";
import { useDb } from "@/lib/useDb";
import { useSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { BookOpen, FileText, Star } from "lucide-react";
import { favoritesRepo } from "@/lib/data/favorites.repo";
import { handleDomainError } from "@/lib/handleError";
import { Button } from "@/components/ui/button";

export function FavoritesPage() {
  const { user } = useSession();
  const favorites = useDb((s) => s.favorites.filter((f) => f.owner_id === user?.id));
  const documents = useDb((s) => s.documents);
  const shared = useDb((s) => s.shared_documents);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
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
                      onClick={() => favoritesRepo.remove(f.id).catch(handleDomainError)}
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
                    onClick={() => favoritesRepo.remove(f.id).catch(handleDomainError)}
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
