import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useDb } from "@/lib/useDb";
import { documentsRepo } from "@/lib/data/documents.repo";
import { getRecents, type RecentEntry } from "@/lib/recents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Plus, Star, Timer } from "lucide-react";

export function Dashboard() {
  const { user } = useSession();
  const navigate = useNavigate();
  const documents = useDb((s) => s.documents);
  const sharedDocs = useDb((s) => s.shared_documents);
  const favorites = useDb((s) => s.favorites);

  const [recents, setRecents] = useState<RecentEntry[]>([]);
  useEffect(() => {
    const update = () => setRecents(getRecents());
    update();
    window.addEventListener("kv:recents-changed", update);
    return () => window.removeEventListener("kv:recents-changed", update);
  }, []);

  if (!user) return null;

  const myDocs = documents.filter((d) => d.owner_id === user.id);
  const myFavorites = favorites.filter((f) => f.owner_id === user.id);

  const resolveRecent = (r: RecentEntry) => {
    if (r.scope === "personal") {
      const d = documents.find((x) => x.id === r.id);
      return d ? { title: d.title, to: `/workspace/${d.id}`, scope: r.scope } : null;
    }
    const s = sharedDocs.find((x) => x.id === r.id);
    return s ? { title: s.title, to: `/shared/${s.id}`, scope: r.scope } : null;
  };

  const resolvedRecents = recents.map(resolveRecent).filter(Boolean).slice(0, 6);

  const resolveFav = (f: (typeof favorites)[number]) => {
    if (f.document_scope === "personal") {
      const d = documents.find((x) => x.id === f.document_id);
      return d ? { title: d.title, to: `/workspace/${d.id}` } : null;
    }
    const s = sharedDocs.find((x) => x.id === f.document_id);
    return s ? { title: s.title, to: `/shared/${s.id}` } : null;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Olá, {user.name.split(" ")[0]}.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retome seu trabalho ou comece algo novo. Seu vault tem {myDocs.length} documento
          {myDocs.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          onClick={async () => {
            const d = await documentsRepo.create({
              owner_id: user.id,
              title: "Sem título",
              content: "",
              folder_id: null,
            });
            navigate(`/workspace/${d.id}`);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo documento
        </Button>
        <Button variant="outline" asChild>
          <Link to="/workspace">Abrir Workspace</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/shared">Base Compartilhada</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Timer className="h-3.5 w-3.5" /> Recentes
          </h2>
          <Card>
            {resolvedRecents.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhum documento aberto ainda. Abra um documento para vê-lo aqui.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {resolvedRecents.map((r) =>
                  r ? (
                    <li key={r.to}>
                      <Link
                        to={r.to}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{r.title}</span>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {r.scope}
                        </span>
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Star className="h-3.5 w-3.5" /> Favoritos
          </h2>
          <Card>
            {myFavorites.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Marque um documento com estrela para vê-lo aqui.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {myFavorites
                  .map((f) => ({ f, r: resolveFav(f) }))
                  .filter((x) => x.r)
                  .map(({ f, r }) => (
                    <li key={f.id}>
                      <Link
                        to={r!.to}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
                      >
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="flex-1 truncate">{r!.title}</span>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {f.document_scope}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
