import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "@/lib/session";
import { isGatewayMode } from "@/lib/data/dataSource";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { GatewayAuthForm } from "@/components/auth/GatewayAuthForm";
import { Compass } from "lucide-react";

// Mock mode has no real sign-up concept — MockLoginPicker just picks one of
// the seeded users — so this route only makes sense against a real gateway.
export function SignUpPage() {
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  if (!isGatewayMode()) return <Navigate to="/login" replace />;

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
