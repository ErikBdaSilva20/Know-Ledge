import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSession } from "@/lib/session";
import { isGatewayMode } from "@/lib/data/dataSource";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { GatewayAuthForm } from "@/components/auth/GatewayAuthForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Compass } from "lucide-react";

// Mock mode has no real credentials to check — just flips the local
// `kv:logado` flag (see session.tsx). No profile picker: mock mode always
// resolves to the same fixed user once logged in.
function MockLoginButton() {
  const { setLoggedIn } = useSession();
  const navigate = useNavigate();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
      <p className="mt-1 text-sm text-muted-foreground">Modo mock — sem backend real.</p>
      <Button
        className="mt-6 w-full"
        onClick={() => {
          setLoggedIn(true);
          navigate("/dashboard");
        }}
      >
        Entrar
      </Button>
      <Card className="mt-6 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Login real virá do backend (MasIA / Better-Auth). Este botão apenas simula uma sessão
          local para desenvolvimento do frontend.
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
      {isGatewayMode() ? <GatewayAuthForm mode="signin" /> : <MockLoginButton />}
    </AuthSplitLayout>
  );
}
