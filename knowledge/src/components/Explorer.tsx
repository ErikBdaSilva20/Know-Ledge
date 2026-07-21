import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { documentsRepo } from "@/lib/data/documents.repo";
import { foldersRepo } from "@/lib/data/folders.repo";
import { isGatewayMode } from "@/lib/data/dataSource";
import { handleDomainError } from "@/lib/handleError";
import { useSession } from "@/lib/session";
import type { Document, Folder } from "@/lib/types";
import { useDb } from "@/lib/useDb";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "./ConfirmDialog";
import { SideNavShell } from "./SideNavShell";

interface Props {
  activeDocId?: string;
  onCollapsedChange?: (collapsed: boolean) => void;
  hidden?: boolean;
}

function isDescendant(allFolders: Folder[], candidateParentId: string, folderId: string): boolean {
  if (candidateParentId === folderId) return true;
  let cur: string | null = candidateParentId;
  const byId = new Map(allFolders.map((f) => [f.id, f]));
  while (cur) {
    if (cur === folderId) return true;
    const f = byId.get(cur);
    cur = f?.parent_id ?? null;
  }
  return false;
}

export function Explorer({ activeDocId, onCollapsedChange, hidden }: Props) {
  const { user, can } = useSession();
  const navigate = useNavigate();
  const mockFolders = useDb((s) => s.folders);
  const mockDocuments = useDb((s) => s.documents);
  const users = useDb((s) => s.users);

  // useDb only ever reflects the local mock store — in gateway mode, writes
  // go to the real backend but nothing repopulates useDb from it, so a
  // successfully created folder/document would never appear here (looked
  // like the buttons did nothing, even though the gateway logged a 201).
  // Fetch straight from the repos instead, and refetch after every mutation
  // this component makes.
  const [gatewayFolders, setGatewayFolders] = useState<Folder[]>([]);
  const [gatewayDocuments, setGatewayDocuments] = useState<Document[]>([]);

  const refreshGatewayData = async () => {
    if (!isGatewayMode()) return;
    const [f, d] = await Promise.all([foldersRepo.list(), documentsRepo.list()]);
    setGatewayFolders(f);
    setGatewayDocuments(d);
  };

  useEffect(() => {
    refreshGatewayData();
  }, []);

  const folders = isGatewayMode() ? gatewayFolders : mockFolders;
  const documents = isGatewayMode() ? gatewayDocuments : mockDocuments;

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = useState<{ kind: "folder" | "document"; id: string } | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  // Track items (folders OR documents) just created inline — committing an
  // empty name deletes them (nothing can be saved without a name).
  const [pendingNewItems, setPendingNewItems] = useState<Set<string>>(new Set());
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  // The last folder the user clicked in the tree — "Novo documento" in the
  // toolbar above drops the new doc there instead of always at root, so
  // opening a folder and hitting the top button behaves like "new doc here".
  const [lastClickedFolderId, setLastClickedFolderId] = useState<string | null>(null);

  const seeAll = can("seeAllDocs");
  const visibleFolders = useMemo(
    () => (seeAll ? folders : folders.filter((f) => f.owner_id === user?.id)),
    [folders, seeAll, user?.id],
  );
  const visibleDocs = useMemo(
    () => (seeAll ? documents : documents.filter((d) => d.owner_id === user?.id)),
    [documents, seeAll, user?.id],
  );

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const groups = useMemo(() => {
    if (!seeAll || !user) return [{ owner: user, folders: visibleFolders, docs: visibleDocs }];
    const byOwner = new Map<string, { folders: Folder[]; docs: Document[] }>();
    for (const f of visibleFolders) {
      if (!byOwner.has(f.owner_id)) byOwner.set(f.owner_id, { folders: [], docs: [] });
      byOwner.get(f.owner_id)!.folders.push(f);
    }
    for (const d of visibleDocs) {
      if (!byOwner.has(d.owner_id)) byOwner.set(d.owner_id, { folders: [], docs: [] });
      byOwner.get(d.owner_id)!.docs.push(d);
    }
    return Array.from(byOwner.entries()).map(([ownerId, g]) => ({
      owner: userMap.get(ownerId) ?? null,
      folders: g.folders,
      docs: g.docs,
    }));
  }, [seeAll, user, visibleFolders, visibleDocs, userMap]);

  const toggle = (id: string) => setOpenFolders((s) => ({ ...s, [id]: !s[id] }));

  // Create document inline: mirrors createFolder. The doc is created with a
  // placeholder title and immediately enters rename mode (file icon, empty
  // input). Committing an empty name deletes it; committing a name opens it
  // in the editor (naming-then-editing is the point of a new document).
  const createDoc = async (ownerId: string, folderId: string | null) => {
    try {
      const d = await documentsRepo.create({
        owner_id: ownerId,
        folder_id: folderId,
        title: "Novo documento",
        content: "",
      });
      await refreshGatewayData();
      if (folderId) setOpenFolders((s) => ({ ...s, [folderId]: true }));
      setPendingNewItems((s) => {
        const n = new Set(s);
        n.add(d.id);
        return n;
      });
      setRenaming({ kind: "document", id: d.id });
      setRenameValue("");
    } catch (err) {
      handleDomainError(err, navigate);
    }
  };

  // Create folder inline: no prompt. Folder is created with a placeholder name and
  // immediately enters rename mode. If the user commits an empty name, the pending
  // folder is deleted (folders cannot be saved without a name).
  const createFolder = async (ownerId: string, parentId: string | null) => {
    try {
      const f = await foldersRepo.create({
        owner_id: ownerId,
        parent_id: parentId,
        name: "Nova pasta",
      });
      await refreshGatewayData();
      if (parentId) setOpenFolders((s) => ({ ...s, [parentId]: true }));
      setPendingNewItems((s) => {
        const n = new Set(s);
        n.add(f.id);
        return n;
      });
      setRenaming({ kind: "folder", id: f.id });
      setRenameValue("");
    } catch (err) {
      handleDomainError(err, navigate);
    }
  };

  const startRename = (kind: "folder" | "document", id: string, current: string) => {
    setRenaming({ kind, id });
    setRenameValue(current);
  };

  const commitRename = async () => {
    if (!renaming) return;
    const { kind, id } = renaming;
    const v = renameValue.trim();
    const isPendingNew = pendingNewItems.has(id);

    try {
      if (!v) {
        // Empty name on a brand-new item: delete it (can't save without a name).
        if (isPendingNew) {
          if (kind === "folder") await foldersRepo.remove(id);
          else await documentsRepo.remove(id);
          await refreshGatewayData();
          setPendingNewItems((s) => {
            const n = new Set(s);
            n.delete(id);
            return n;
          });
          if (kind === "folder") setLastClickedFolderId((cur) => (cur === id ? null : cur));
        }
        // For an existing item, empty name is just a no-op cancel.
        setRenaming(null);
        return;
      }

      if (kind === "folder") await foldersRepo.update(id, { name: v });
      else await documentsRepo.update(id, { title: v });
      await refreshGatewayData();

      if (isPendingNew) {
        setPendingNewItems((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
      setRenaming(null);

      // A freshly-named document opens in the editor — folders just stay put.
      if (isPendingNew && kind === "document") navigate(`/workspace/${id}`);
    } catch (err) {
      handleDomainError(err, navigate);
    }
  };

  const cancelRename = async () => {
    if (!renaming) return;
    const { kind, id } = renaming;
    try {
      // Cancelling a brand-new item without a name → delete it.
      if (pendingNewItems.has(id) && !renameValue.trim()) {
        if (kind === "folder") await foldersRepo.remove(id);
        else await documentsRepo.remove(id);
        await refreshGatewayData();
        setPendingNewItems((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
        if (kind === "folder") setLastClickedFolderId((cur) => (cur === id ? null : cur));
      }
      setRenaming(null);
    } catch (err) {
      handleDomainError(err, navigate);
    }
  };

  const canDragFolder = (f: Folder) => !!user && f.owner_id === user.id;
  const canDragDoc = (d: Document) => !!user && d.owner_id === user.id;
  const canDropOnTarget = (targetOwnerId: string) => !!user && targetOwnerId === user.id;

  const handleDropOnFolder = async (
    e: React.DragEvent,
    targetFolder: Folder,
    allFolders: Folder[],
    allDocs: Document[],
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    if (!user || !canDropOnTarget(targetFolder.owner_id)) return;

    const draggedFolderId = e.dataTransfer.getData("application/x-folder-id");
    if (draggedFolderId) {
      const dragged = allFolders.find((f) => f.id === draggedFolderId);
      if (!dragged || dragged.owner_id !== user.id) return;
      if (isDescendant(allFolders, targetFolder.id, dragged.id)) return;
      if (dragged.parent_id === targetFolder.id) return;
      try {
        await foldersRepo.update(draggedFolderId, { parent_id: targetFolder.id });
        await refreshGatewayData();
        setOpenFolders((s) => ({ ...s, [targetFolder.id]: true }));
      } catch (err) {
        handleDomainError(err, navigate);
      }
      return;
    }

    const draggedDocId = e.dataTransfer.getData("application/x-document-id");
    if (draggedDocId) {
      const dragged = allDocs.find((d) => d.id === draggedDocId);
      if (!dragged || dragged.owner_id !== user.id) return;
      if (dragged.folder_id === targetFolder.id) return;
      try {
        await documentsRepo.update(draggedDocId, { folder_id: targetFolder.id });
        await refreshGatewayData();
        setOpenFolders((s) => ({ ...s, [targetFolder.id]: true }));
      } catch (err) {
        handleDomainError(err, navigate);
      }
    }
  };

  const handleDropOnRoot = async (e: React.DragEvent, ownerId: string) => {
    e.preventDefault();
    setRootDragOver(false);
    if (!user || ownerId !== user.id) return;

    const draggedFolderId = e.dataTransfer.getData("application/x-folder-id");
    if (draggedFolderId) {
      const dragged = folders.find((f) => f.id === draggedFolderId);
      if (!dragged || dragged.owner_id !== user.id || dragged.parent_id === null) return;
      try {
        await foldersRepo.update(draggedFolderId, { parent_id: null });
        await refreshGatewayData();
      } catch (err) {
        handleDomainError(err, navigate);
      }
      return;
    }

    const draggedDocId = e.dataTransfer.getData("application/x-document-id");
    if (draggedDocId) {
      const dragged = documents.find((d) => d.id === draggedDocId);
      if (!dragged || dragged.owner_id !== user.id || dragged.folder_id === null) return;
      try {
        await documentsRepo.update(draggedDocId, { folder_id: null });
        await refreshGatewayData();
      } catch (err) {
        handleDomainError(err, navigate);
      }
    }
  };

  const renderFolder = (
    folder: Folder,
    allFolders: Folder[],
    allDocs: Document[],
    depth: number,
  ) => {
    const isOpen = openFolders[folder.id] ?? depth < 1;
    const childFolders = allFolders.filter((f) => f.parent_id === folder.id);
    const childDocs = allDocs.filter((d) => d.folder_id === folder.id);
    const isRenaming = renaming?.kind === "folder" && renaming.id === folder.id;
    const draggable = canDragFolder(folder);
    const isDragOver = dragOverId === folder.id;

    return (
      <div key={folder.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (isRenaming) return;
            toggle(folder.id);
            setLastClickedFolderId(folder.id);
          }}
          onKeyDown={(e) => {
            if (isRenaming) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle(folder.id);
              setLastClickedFolderId(folder.id);
            }
          }}
          draggable={draggable && !isRenaming}
          onDragStart={(e) => {
            if (!draggable) return;
            e.dataTransfer.setData("application/x-folder-id", folder.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            if (!canDropOnTarget(folder.owner_id)) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            if (dragOverId !== folder.id) setDragOverId(folder.id);
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            if (dragOverId === folder.id) setDragOverId(null);
          }}
          onDrop={(e) => handleDropOnFolder(e, folder, allFolders, allDocs)}
          className={cn(
            "group flex cursor-pointer select-none items-center gap-1 rounded px-1.5 py-1 text-sm hover:bg-accent",
            isDragOver && "bg-accent ring-1 ring-primary",
          )}
          style={{ paddingLeft: 4 + depth * 12 }}
        >
          <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
          <FolderIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              placeholder="Nome da pasta"
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") cancelRename();
              }}
              className="flex-1 rounded border border-input bg-background px-1 text-sm outline-none"
            />
          ) : (
            <span className="flex-1 truncate">{folder.name}</span>
          )}
          <span onClick={(e) => e.stopPropagation()}>
            <FolderMenu
              onNewDoc={() => createDoc(folder.owner_id, folder.id)}
              onNewFolder={() => createFolder(folder.owner_id, folder.id)}
              onRename={() => startRename("folder", folder.id, folder.name)}
              onDelete={() =>
                foldersRepo
                  .remove(folder.id)
                  .then(() => {
                    setLastClickedFolderId((cur) => (cur === folder.id ? null : cur));
                    return refreshGatewayData();
                  })
                  .catch((err) => handleDomainError(err, navigate))
              }
              itemName={folder.name}
              isFolder
            />
          </span>
        </div>
        {isOpen && (
          <div>
            {childFolders.map((f) => renderFolder(f, allFolders, allDocs, depth + 1))}
            {childDocs.map((d) => renderDoc(d, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderDoc = (doc: Document, depth: number) => {
    const isRenaming = renaming?.kind === "document" && renaming.id === doc.id;
    const isActive = doc.id === activeDocId;
    const draggable = canDragDoc(doc);
    return (
      <div
        key={doc.id}
        draggable={draggable && !isRenaming}
        onDragStart={(e) => {
          if (!draggable) return;
          e.dataTransfer.setData("application/x-document-id", doc.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className={cn(
          "group flex items-center gap-1 rounded px-1.5 py-1 text-sm hover:bg-accent",
          isActive && "bg-accent font-medium",
        )}
        style={{ paddingLeft: 4 + depth * 12 + 16 }}
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            placeholder="Nome do documento"
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            className="flex-1 rounded border border-input bg-background px-1 text-sm outline-none"
          />
        ) : (
          <Link to={`/workspace/${doc.id}`} className="flex-1 truncate">
            {doc.title || "Sem título"}
          </Link>
        )}
        <FolderMenu
          onRename={() => startRename("document", doc.id, doc.title)}
          onDelete={() =>
            documentsRepo
              .remove(doc.id)
              .then(refreshGatewayData)
              .catch((err) => handleDomainError(err, navigate))
          }
          itemName={doc.title || "Sem título"}
        />
      </div>
    );
  };

  return (
    <SideNavShell
      storageKey="kv:explorer:collapsed:v1"
      title="Explorer"
      icon={<PanelLeft className="h-3.5 w-3.5" />}
      hidden={hidden}
      onCollapsedChange={onCollapsedChange}
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Nova pasta na raiz"
            onClick={() => user && createFolder(user.id, null)}
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title={
              lastClickedFolderId ? "Novo documento na pasta selecionada" : "Novo documento na raiz"
            }
            onClick={() => {
              if (!user) return;
              // Guard against a stale reference to a folder that's since
              // been deleted or moved out of view — fall back to root.
              const targetFolderId =
                lastClickedFolderId && folders.some((f) => f.id === lastClickedFolderId)
                  ? lastClickedFolderId
                  : null;
              createDoc(user.id, targetFolderId);
            }}
          >
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto p-1.5">
        {groups.map((g, idx) => {
          const rootFolders = g.folders.filter((f) => !f.parent_id);
          const rootDocs = g.docs.filter((d) => !d.folder_id);
          const isMe = !!user && g.owner?.id === user.id;
          return (
            <div
              key={g.owner?.id ?? idx}
              className={cn("mb-3 rounded", isMe && rootDragOver && "ring-1 ring-primary")}
              onDragOver={(e) => {
                if (!isMe) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (!rootDragOver) setRootDragOver(true);
              }}
              onDragLeave={() => rootDragOver && setRootDragOver(false)}
              onDrop={(e) => g.owner && handleDropOnRoot(e, g.owner.id)}
            >
              {seeAll && g.owner && (
                <div className="mb-1 flex items-center gap-2 px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold text-primary">
                    {g.owner.name.slice(0, 1)}
                  </div>
                  {g.owner.name}
                </div>
              )}
              {rootFolders.map((f) => renderFolder(f, g.folders, g.docs, 0))}
              {rootDocs.map((d) => renderDoc(d, 0))}
              {rootFolders.length === 0 && rootDocs.length === 0 && (
                <p className="px-3 py-4 text-xs text-muted-foreground">
                  Sem documentos ainda. Crie um documento acima.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </SideNavShell>
  );
}

interface MenuProps {
  onNewDoc?: () => void;
  onNewFolder?: () => void;
  onRename: () => void;
  onDelete: () => void;
  itemName: string;
  isFolder?: boolean;
}

function FolderMenu({ onNewDoc, onNewFolder, onRename, onDelete, itemName, isFolder }: MenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {onNewDoc && (
          <DropdownMenuItem onSelect={onNewDoc}>
            <FilePlus className="mr-2 h-3.5 w-3.5" /> Novo documento
          </DropdownMenuItem>
        )}
        {onNewFolder && (
          <DropdownMenuItem onSelect={onNewFolder}>
            <FolderPlus className="mr-2 h-3.5 w-3.5" /> Nova subpasta
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onRename}>
          <Pencil className="mr-2 h-3.5 w-3.5" /> Renomear
        </DropdownMenuItem>
        <ConfirmDialog
          title={isFolder ? `Excluir pasta "${itemName}"?` : `Excluir "${itemName}"?`}
          description={
            isFolder
              ? "Todos os documentos e subpastas dentro serão excluídos permanentemente. Esta ação não pode ser desfeita."
              : "Este documento será excluído permanentemente. Esta ação não pode ser desfeita."
          }
          onConfirm={onDelete}
        >
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
          </DropdownMenuItem>
        </ConfirmDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
