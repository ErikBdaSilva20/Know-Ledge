import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/session";
import { useDb } from "@/lib/useDb";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, FileText, Folder as FolderIcon, Trash2, Users } from "lucide-react";
import { documentsRepo } from "@/lib/repos/documents";
import { sharedDocumentsRepo } from "@/lib/repos/sharedDocuments";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Role } from "@/lib/types";

export function AdminPage() {
  const { can } = useSession();
  const navigate = useNavigate();
  const documents = useDb((s) => s.documents);
  const folders = useDb((s) => s.folders);
  const shared = useDb((s) => s.shared_documents);
  const users = useDb((s) => s.users);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const allowed = can("publishShared");
  useEffect(() => {
    if (!allowed) navigate("/dashboard", { replace: true });
  }, [allowed, navigate]);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const filteredDocs = useMemo(() => {
    let list = documents;
    if (ownerFilter !== "all") list = list.filter((d) => d.owner_id === ownerFilter);
    if (q) list = list.filter((d) => d.title.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [documents, ownerFilter, q]);

  if (!allowed) return null;

  const roleLabel: Record<Role, string> = { rep: "Membro", manager: "Gestor", admin: "Admin" };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Administração</h1>
      <p className="mt-1 text-sm text-muted-foreground">Curadoria, visão geral e métricas.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric
          label="Documentos"
          value={documents.length}
          icon={<FileText className="h-4 w-4" />}
        />
        <Metric label="Pastas" value={folders.length} icon={<FolderIcon className="h-4 w-4" />} />
        <Metric label="Publicados" value={shared.length} icon={<BookOpen className="h-4 w-4" />} />
        <Metric label="Usuários" value={users.length} icon={<Users className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="docs" className="mt-8">
        <TabsList>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="shared">Base Compartilhada</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="mt-4">
          <div className="mb-3 flex gap-2">
            <Input
              placeholder="Buscar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Todos os donos</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <Card>
            <ul className="divide-y divide-border">
              {filteredDocs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Link
                    to={`/workspace/${d.id}`}
                    className="flex-1 truncate text-sm hover:underline"
                  >
                    {d.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {userMap.get(d.owner_id)?.name}
                  </span>
                  <ConfirmDialog
                    title={`Excluir "${d.title}"?`}
                    description="Exclusão permanente. Não pode ser desfeita."
                    onConfirm={() => documentsRepo.remove(d.id)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </ConfirmDialog>
                </li>
              ))}
              {filteredDocs.length === 0 && (
                <li className="p-4 text-center text-sm text-muted-foreground">Nada encontrado.</li>
              )}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="mt-4">
          <Card>
            <ul className="divide-y divide-border">
              {shared.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Link to={`/shared/${s.id}`} className="flex-1 truncate text-sm hover:underline">
                    {s.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    Por {userMap.get(s.published_by)?.name}
                  </span>
                  <ConfirmDialog
                    title={`Remover "${s.title}"?`}
                    description="Remove permanentemente da Base Compartilhada."
                    onConfirm={() => sharedDocumentsRepo.remove(s.id)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </ConfirmDialog>
                </li>
              ))}
              {shared.length === 0 && (
                <li className="p-4 text-center text-sm text-muted-foreground">
                  Nenhum documento publicado.
                </li>
              )}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {u.name.slice(0, 1)}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {roleLabel[u.role]}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-3 text-xs text-muted-foreground">
              Gestão de usuários vem do backend (Better-Auth). Aqui, apenas visualização.
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-2xl font-semibold">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
