import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/session";
import { useDb } from "@/lib/useDb";
import { isGatewayMode, setDevPreviewActive } from "@/lib/data/dataSource";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { GatewayAuthForm } from "@/components/auth/GatewayAuthForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

// Dev-only escape hatch (see dataSource.ts): flips the app into mock mode at
// runtime so the 3 mocked roles can be eyeballed without editing .env.local +
// rebuilding. Never rendered in prod builds (import.meta.env.DEV is false).
function DevPreviewLink() {
  return (
    <button
      type="button"
      onClick={() => {
        setDevPreviewActive(true);
        window.location.reload();
      }}
      className="mt-4 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      Preview mockado (dev) — ver telas como rep / gestor / admin
    </button>
  );
}

function MockLoginPicker() {
  const users = useDb((s) => s.users);
  const { setUserId } = useSession();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const roleLabel: Record<Role, string> = {
    rep: "Membro",
    manager: "Gestor",
    admin: "Administrador",
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Entrar como…</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Login mockado — escolha um perfil para explorar os 3 papéis.
      </p>
      <div className="mt-6 space-y-2">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setSelected(u.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary",
              selected === u.id && "border-primary ring-2 ring-primary/20",
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {u.name.slice(0, 1)}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{u.name}</span>
              <span className="text-xs text-muted-foreground">{u.email}</span>
            </div>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {roleLabel[u.role]}
            </span>
          </button>
        ))}
      </div>
      <Button
        className="mt-6 w-full"
        disabled={!selected}
        onClick={() => {
          if (selected) {
            setUserId(selected);
            navigate("/dashboard");
          }
        }}
      >
        Entrar
      </Button>
      <Card className="mt-6 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Login real virá do backend (MasIA / Better-Auth). Este seletor apenas simula os três
          papéis para desenvolvimento do frontend.
        </CardContent>
      </Card>
    </>
  );
}

export function LoginPage() {
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <AuthSplitLayout>
      <div className="mb-8 flex items-center gap-2">
        <Compass className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">Knowledge Vault</span>
      </div>
      {isGatewayMode() ? (
        <>
          <GatewayAuthForm mode="signin" />
          {import.meta.env.DEV && <DevPreviewLink />}
        </>
      ) : (
        <MockLoginPicker />
      )}
    </AuthSplitLayout>
  );
}
