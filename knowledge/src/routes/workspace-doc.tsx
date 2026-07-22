import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Editor } from "@/components/Editor";
import { Backlinks } from "@/components/Backlinks";
import { PublishToSharedButton } from "@/components/PublishToSharedButton";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { favoritesRepo } from "@/lib/data/favorites.repo";
import { documentsRepo } from "@/lib/data/documents.repo";
import { useGatewayList } from "@/lib/useGatewayList";
import { handleDomainError } from "@/lib/handleError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Document } from "@/lib/types";

export function WorkspaceDoc() {
  const { docId } = useParams<{ docId: string }>();
  const { user, can } = useSession();
  const navigate = useNavigate();

  // The generic gateway mode only supports list-then-find (Importantdoc.md §B5),
  // so load the personal docs and pick this one out for the owner check, the
  // delete-confirm title, and the "publish" payload.
  const [doc, setDoc] = useState<Document | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    setDoc(undefined);
    documentsRepo.list().then((docs) => {
      if (!cancelled) setDoc(docs.find((d) => d.id === docId));
    });
    return () => {
      cancelled = true;
    };
  }, [docId]);

  const { data: allFavorites, refresh: refreshFavorites } = useGatewayList(favoritesRepo.list);
  const favorite = allFavorites.find(
    (f) => f.owner_id === user?.id && f.document_scope === "personal" && f.document_id === docId,
  );

  const isOwner = doc?.owner_id === user?.id;
  const canEdit = isOwner || can("seeAllDocs");

  if (!doc || !docId) {
    return (
      <>
        <div className="flex flex-1 items-center justify-center p-10 text-muted-foreground">
          Documento não encontrado.
        </div>
      </>
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <Link
            to="/workspace"
            className="mr-1 rounded p-1 hover:bg-accent md:hidden"
            aria-label="Voltar ao explorer"
          >
            ← Explorer
          </Link>
          {doc.owner_name && (
            <span className="truncate">
              Dono: <span className="font-medium text-foreground">{doc.owner_name}</span>
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
                      document_scope: "personal",
                      document_id: docId,
                    });
                  await refreshFavorites();
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
            <PublishToSharedButton doc={doc} />
            {canEdit && (
              <ConfirmDialog
                title={`Excluir "${doc.title || "Sem título"}"?`}
                description="Este documento será excluído permanentemente. Esta ação não pode ser desfeita."
                onConfirm={async () => {
                  try {
                    await documentsRepo.remove(docId);
                    navigate("/workspace");
                  } catch (err) {
                    handleDomainError(err, navigate);
                  }
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Excluir
                </Button>
              </ConfirmDialog>
            )}
          </span>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <Backlinks scope="personal" id={docId} />
          <Editor scope="personal" id={docId} readOnly={!canEdit} />
        </div>
      </div>
    </div>
  );
}
