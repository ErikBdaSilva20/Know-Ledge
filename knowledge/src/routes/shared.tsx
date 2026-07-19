import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDb } from "@/lib/useDb";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Search as SearchIcon } from "lucide-react";
import { sharedDocumentsRepo } from "@/lib/repos/sharedDocuments";
import { SideNavShell } from "@/components/SideNavShell";
import { cn } from "@/lib/utils";

export function SharedLayout() {
  const shared = useDb((s) => s.shared_documents);
  const users = useDb((s) => s.users);
  const { user, can } = useSession();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const hasDoc = pathname.startsWith("/shared/") && pathname !== "/shared/";

  const filtered = useMemo(
    () => shared.filter((s) => s.title.toLowerCase().includes(q.toLowerCase())),
    [shared, q],
  );

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  return (
    <div
      className={cn(
        "grid h-full grid-cols-1",
        collapsed ? "md:grid-cols-[40px_1fr]" : "md:grid-cols-[320px_1fr]",
      )}
    >
      <div className={cn("min-h-0", hasDoc && "hidden md:block")}>
        <SideNavShell
          storageKey="kv:shared:collapsed:v1"
          title="Base Compartilhada"
          icon={<BookOpen className="h-3.5 w-3.5" />}
          onCollapsedChange={setCollapsed}
          actions={
            can("publishShared") ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Novo documento compartilhado"
                onClick={async () => {
                  if (!user) return;
                  const s = await sharedDocumentsRepo.create({
                    title: "Sem título",
                    content: "",
                    source_document_id: null,
                    published_by: user.id,
                  });
                  navigate(`/shared/${s.id}`);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            ) : undefined
          }
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                className="h-8 pl-7 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">Nenhum documento publicado ainda.</p>
            ) : (
              filtered.map((s) => (
                <Link
                  key={s.id}
                  to={`/shared/${s.id}`}
                  className="flex flex-col rounded px-2 py-2 text-sm hover:bg-accent"
                >
                  <span className="truncate font-medium">{s.title || "Sem título"}</span>
                  <span className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                    Por {userMap.get(s.published_by)?.name ?? "—"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </SideNavShell>
      </div>
      <div className={cn("flex min-w-0 flex-col", !hasDoc && "hidden md:flex")}>
        <Outlet />
      </div>
    </div>
  );
}
