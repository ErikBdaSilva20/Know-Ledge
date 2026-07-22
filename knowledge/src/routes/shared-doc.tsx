import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Editor } from "@/components/Editor";
import { Backlinks } from "@/components/Backlinks";
import { useDb } from "@/lib/useDb";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { favoritesRepo } from "@/lib/data/favorites.repo";
import { sharedDocumentsRepo } from "@/lib/data/sharedDocuments.repo";
import { documentsRepo } from "@/lib/data/documents.repo";
import { isGatewayMode } from "@/lib/data/dataSource";
import { useGatewayList } from "@/lib/useGatewayList";
import { handleDomainError } from "@/lib/handleError";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { SharedDocument } from "@/lib/types";

export function SharedDoc() {
  const { docId } = useParams<{ docId: string }>();
  const { user, can } = useSession();
  const navigate = useNavigate();
  const mockDoc = useDb((s) => s.shared_documents.find((d) => d.id === docId));

  // Same gateway-mode gap as Editor.tsx / WorkspaceDoc.tsx.
  const [gatewayDoc, setGatewayDoc] = useState<SharedDocument | undefined>(undefined);
  useEffect(() => {
    if (!isGatewayMode()) return;
    let cancelled = false;
    setGatewayDoc(undefined);
    sharedDocumentsRepo.list().then((docs) => {
      if (!cancelled) setGatewayDoc(docs.find((d) => d.id === docId));
    });
    return () => {
      cancelled = true;
    };
  }, [docId]);

  const doc = isGatewayMode() ? gatewayDoc : mockDoc;
  const mockDocuments = useDb((s) => s.documents);
  const { data: allDocuments } = useGatewayList(mockDocuments, documentsRepo.list);
  const sourceDoc = doc?.source_document_id
    ? (allDocuments.find((d) => d.id === doc.source_document_id) ?? null)
    : null;
  const mockFavorites = useDb((s) => s.favorites);
  const { data: allFavorites, refresh: refreshFavorites } = useGatewayList(
    mockFavorites,
    favoritesRepo.list,
  );
  const favorite = allFavorites.find(
    (f) => f.owner_id === user?.id && f.document_scope === "shared" && f.document_id === docId,
  );

  // Shared content is immutable (the Editor enforces read-only for scope
  // "shared"); this only gates curation — removing the doc from the Base.
  const canManage = can("editShared");

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
          <span className="font-medium text-foreground">{doc.published_by_name ?? "—"}</span>
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
          {canManage && (
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
        <Editor scope="shared" id={docId} readOnly />
      </div>
    </div>
  );
}
