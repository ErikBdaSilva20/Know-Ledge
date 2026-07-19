import { FolderTree } from "lucide-react";

export function WorkspaceIndex() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
      <FolderTree className="h-10 w-10 opacity-40" />
      <p className="text-sm">Selecione um documento no Explorer, ou crie um novo.</p>
    </div>
  );
}
