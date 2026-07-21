import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, FileText, Folder as FolderIcon } from "lucide-react";
import type { Document, Folder } from "@/lib/types";

// All documents in a folder and every one of its descendant subfolders — the
// "pasta inteira" scope for batch publish (Bloco 5). `folders`/`documents`
// are expected pre-scoped to one owner (as admin.tsx's vault groups already
// are), so this never crosses into someone else's vault.
export function collectDocsInSubtree(
  folderId: string,
  folders: Folder[],
  documents: Document[],
): Document[] {
  const own = documents.filter((d) => d.folder_id === folderId);
  const childFolderIds = folders.filter((f) => f.parent_id === folderId).map((f) => f.id);
  const nested = childFolderIds.flatMap((id) => collectDocsInSubtree(id, folders, documents));
  return [...own, ...nested];
}

interface FolderTreeProps {
  folders: Folder[];
  documents: Document[];
  /** Optional trailing action rendered on each document row (e.g. publish). */
  docAction?: (doc: Document) => ReactNode;
  /** Optional trailing action rendered on each folder row (e.g. batch publish). */
  folderAction?: (folder: Folder) => ReactNode;
}

// A read-only folder/document tree for curation views (admin). Deliberately
// separate from Explorer's editable tree — no rename, drag, or create — so it
// stays simple and can't mutate someone else's vault.
export function FolderTree({ folders, documents, docAction, folderAction }: FolderTreeProps) {
  const rootFolders = folders.filter((f) => !f.parent_id);
  const rootDocs = documents.filter((d) => !d.folder_id);

  if (rootFolders.length === 0 && rootDocs.length === 0) {
    return <p className="px-3 py-3 text-xs text-muted-foreground">Vazio.</p>;
  }

  return (
    <div>
      {rootFolders.map((f) => (
        <FolderNode
          key={f.id}
          folder={f}
          folders={folders}
          documents={documents}
          depth={0}
          docAction={docAction}
          folderAction={folderAction}
        />
      ))}
      {rootDocs.map((d) => (
        <DocRow key={d.id} doc={d} depth={0} docAction={docAction} />
      ))}
    </div>
  );
}

function FolderNode({
  folder,
  folders,
  documents,
  depth,
  docAction,
  folderAction,
}: {
  folder: Folder;
  folders: Folder[];
  documents: Document[];
  depth: number;
  docAction?: (doc: Document) => ReactNode;
  folderAction?: (folder: Folder) => ReactNode;
}) {
  const [open, setOpen] = useState(depth < 1);
  const childFolders = folders.filter((f) => f.parent_id === folder.id);
  const childDocs = documents.filter((d) => d.folder_id === folder.id);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="flex cursor-pointer select-none items-center gap-1 rounded px-1.5 py-1 text-sm hover:bg-accent"
        style={{ paddingLeft: 4 + depth * 12 }}
      >
        <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </span>
        <FolderIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex-1 truncate">{folder.name}</span>
        {folderAction && <span onClick={(e) => e.stopPropagation()}>{folderAction(folder)}</span>}
      </div>
      {open && (
        <div>
          {childFolders.map((f) => (
            <FolderNode
              key={f.id}
              folder={f}
              folders={folders}
              documents={documents}
              depth={depth + 1}
              docAction={docAction}
              folderAction={folderAction}
            />
          ))}
          {childDocs.map((d) => (
            <DocRow key={d.id} doc={d} depth={depth + 1} docAction={docAction} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocRow({
  doc,
  depth,
  docAction,
}: {
  doc: Document;
  depth: number;
  docAction?: (doc: Document) => ReactNode;
}) {
  return (
    <div
      className="group flex items-center gap-1 rounded px-1.5 py-1 text-sm hover:bg-accent"
      style={{ paddingLeft: 4 + depth * 12 + 16 }}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <Link to={`/workspace/${doc.id}`} className="flex-1 truncate hover:underline">
        {doc.title || "Sem título"}
      </Link>
      {docAction && (
        <span className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {docAction(doc)}
        </span>
      )}
    </div>
  );
}
