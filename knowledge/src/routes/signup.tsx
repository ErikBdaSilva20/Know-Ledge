import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/lib/session";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { GatewayAuthForm } from "@/components/auth/GatewayAuthForm";
import { Compass } from "lucide-react";

export function SignUpPage() {
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
      <GatewayAuthForm mode="signup" />
    </AuthSplitLayout>
  );
}
