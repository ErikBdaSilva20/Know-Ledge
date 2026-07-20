import { Link, useNavigate, useParams } from "react-router-dom";
import { Editor } from "@/components/Editor";
import { Backlinks } from "@/components/Backlinks";
import { useDb } from "@/lib/useDb";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { favoritesRepo } from "@/lib/data/favorites.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { handleDomainError } from "@/lib/handleError";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function SharedDoc() {
  const { docId } = useParams<{ docId: string }>();
  const { user, can } = useSession();
  const navigate = useNavigate();
  const doc = useDb((s) => s.shared_documents.find((d) => d.id === docId));
  const publishedBy = useDb((s) => (doc ? s.users.find((u) => u.id === doc.published_by) : null));
  const sourceDoc = useDb((s) =>
    doc?.source_document_id ? s.documents.find((d) => d.id === doc.source_document_id) : null,
  );
  const favorite = useDb((s) =>
    s.favorites.find(
      (f) => f.owner_id === user?.id && f.document_scope === "shared" && f.document_id === docId,
    ),
  );

  const canEdit = can("editShared");

  if (!doc || !docId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Documento não encontrado.
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground sm:px-6">
        <Link
          to="/shared"
          className="mr-1 rounded p-1 hover:bg-accent md:hidden"
          aria-label="Voltar à lista"
        >
          ← Lista
        </Link>
        <span className="truncate">
          Publicado por{" "}
          <span className="font-medium text-foreground">{publishedBy?.name ?? "—"}</span>
        </span>
        {sourceDoc && (
          <span className="truncate text-muted-foreground/70">
            · a partir de "{sourceDoc.title}"
          </span>
        )}
        <span className="flex flex-wrap items-center gap-1 sm:ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                if (favorite) await favoritesRepo.remove(favorite.id);
                else if (user)
                  await favoritesRepo.create({
                    owner_id: user.id,
                    document_scope: "shared",
                    document_id: docId,
                  });
              } catch (err) {
                handleDomainError(err, navigate);
              }
            }}
          >
            <Star
              className={"mr-1 h-3.5 w-3.5 " + (favorite ? "fill-amber-500 text-amber-500" : "")}
            />
            {favorite ? "Favorito" : "Favoritar"}
          </Button>
          {canEdit && (
            <ConfirmDialog
              title={`Remover "${doc.title}" da Base Compartilhada?`}
              description="O documento será excluído permanentemente da Base Compartilhada. O documento original (se houver) não é afetado."
              onConfirm={async () => {
                try {
                  await sharedDocumentsRepo.remove(docId);
                  navigate("/shared");
                } catch (err) {
                  handleDomainError(err, navigate);
                }
              }}
            >
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Remover
              </Button>
            </ConfirmDialog>
          )}
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Backlinks scope="shared" id={docId} />
        <Editor scope="shared" id={docId} readOnly={!canEdit} />
      </div>
    </div>
  );
}
