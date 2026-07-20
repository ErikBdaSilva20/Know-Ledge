import { Link, useNavigate, useParams } from "react-router-dom";
import { Editor } from "@/components/Editor";
import { Backlinks } from "@/components/Backlinks";
import { useDb } from "@/lib/useDb";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Star, Upload, Trash2 } from "lucide-react";
import { favoritesRepo } from "@/lib/data/favorites.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { documentsRepo } from "@/lib/data/documents.repo";
import { syncSharedRefs } from "@/lib/syncRefs";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

export function WorkspaceDoc() {
  const { docId } = useParams<{ docId: string }>();
  const { user, can } = useSession();
  const navigate = useNavigate();
  const doc = useDb((s) => s.documents.find((d) => d.id === docId));
  const owner = useDb((s) => (doc ? s.users.find((u) => u.id === doc.owner_id) : null));
  const favorite = useDb((s) =>
    s.favorites.find(
      (f) => f.owner_id === user?.id && f.document_scope === "personal" && f.document_id === docId,
    ),
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
          {owner && (
            <span className="truncate">
              Dono: <span className="font-medium text-foreground">{owner.name}</span>
            </span>
          )}
          <span className="flex flex-wrap items-center gap-1 sm:ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (favorite) await favoritesRepo.remove(favorite.id);
                else if (user)
                  await favoritesRepo.create({
                    owner_id: user.id,
                    document_scope: "personal",
                    document_id: docId,
                  });
              }}
            >
              <Star
                className={"mr-1 h-3.5 w-3.5 " + (favorite ? "fill-amber-500 text-amber-500" : "")}
              />
              {favorite ? "Favorito" : "Favoritar"}
            </Button>
            {can("publishShared") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const s = await sharedDocumentsRepo.create({
                    title: doc.title,
                    content: doc.content,
                    source_document_id: doc.id,
                    published_by: user!.id,
                  });
                  syncSharedRefs(s.id);
                  toast.success("Publicado na Base Compartilhada");
                }}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                Publicar na Base Compartilhada
              </Button>
            )}
            {canEdit && (
              <ConfirmDialog
                title={`Excluir "${doc.title || "Sem título"}"?`}
                description="Este documento será excluído permanentemente. Esta ação não pode ser desfeita."
                onConfirm={async () => {
                  await documentsRepo.remove(docId);
                  navigate("/workspace");
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
