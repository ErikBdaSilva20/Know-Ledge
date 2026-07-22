import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderTree } from "@/components/FolderTree";
import { documentsRepo } from "@/lib/data/documents.repo";
import { handleDomainError } from "@/lib/handleError";
import type { Document, Folder } from "@/lib/types";
import { Folder as FolderIcon } from "lucide-react";

interface Props {
  doc: Document;
  /** This document owner's folders — never a mix of vaults. */
  folders: Folder[];
  onMoved: () => void;
  children: ReactNode;
}

/**
 * Tap-reachable fallback for "move document to another folder" — the only
 * other way to do this is the folder tree's drag-and-drop, which has no
 * touch equivalent. Reuses the same documentsRepo.update({ folder_id })
 * call the drag-and-drop path already makes, and FolderTree's existing
 * read-only rendering (with documents suppressed) for the target picker.
 */
export function MoveDocDialog({ doc, folders, onMoved, children }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentFolderId = doc.folder_id ?? null;

  const moveTo = async (folderId: string | null) => {
    if (folderId === currentFolderId) {
      setOpen(false);
      return;
    }
    try {
      await documentsRepo.update(doc.id, { folder_id: folderId });
      setOpen(false);
      onMoved();
    } catch (err) {
      handleDomainError(err, navigate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mover "{doc.title || "Sem título"}"</DialogTitle>
          <DialogDescription>Escolha a pasta de destino.</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto rounded-md border border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 rounded-none"
            disabled={currentFolderId === null}
            onClick={() => moveTo(null)}
          >
            <FolderIcon className="h-3.5 w-3.5 text-muted-foreground" />
            Raiz
          </Button>
          {folders.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">Nenhuma pasta ainda.</p>
          ) : (
            <FolderTree
              folders={folders}
              documents={[]}
              folderAction={(folder) => (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={folder.id === currentFolderId}
                  onClick={() => moveTo(folder.id)}
                >
                  Mover aqui
                </Button>
              )}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
