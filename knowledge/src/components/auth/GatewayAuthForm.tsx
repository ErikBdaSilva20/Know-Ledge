import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { auth } from "@/lib/data/client";
import { DomainError } from "@/lib/data/errors";
import { handleDomainError } from "@/lib/handleError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  mode: "signin" | "signup";
}

// Story 1.6 AC#4 — in gateway mode there is no mock session to pick from, so
// this renders a real email+password form against auth.signIn()/signUp()
// instead of the mock role picker. Without this, "Entrar" against a real
// gateway called the mock's setUserId() (a no-op there) and silently went
// nowhere — confirmed against the tenant-local harness.
export function GatewayAuthForm({ mode }: Props) {
  const { refreshGatewaySession } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === "signup";
  const canSubmit = isSignUp ? !!(name && email && password) : !!(email && password);

  const submit = async () => {
    setSubmitting(true);
    try {
      if (isSignUp) {
        await auth.signUp(name, email, password);
      } else {
        await auth.signIn(email, password);
      }
      await refreshGatewaySession();
      navigate("/dashboard");
    } catch (err) {
      // Sign-up's most common failure is a duplicate email, which the
      // gateway reports as a 409 -> "conflict" — but errors.ts's generic
      // conflict message ("recarregue e tente de novo") was written for
      // optimistic-concurrency edits, not this. Give sign-up its own text.
      if (isSignUp && err instanceof DomainError && err.type === "conflict") {
        toast.error("Este e-mail já está cadastrado. Tente entrar em vez de criar conta.");
      } else {
        handleDomainError(err, navigate);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {isSignUp ? "Criar conta" : "Entrar"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conectado ao gateway em <code>{import.meta.env.VITE_GATEWAY_URL}</code>.
      </p>
      <div className="mt-6 space-y-3">
        {isSignUp && (
          <Input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <Input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
        />
      </div>
      <Button className="mt-6 w-full" disabled={!canSubmit || submitting} onClick={submit}>
        {submitting
          ? isSignUp
            ? "Criando conta…"
            : "Entrando…"
          : isSignUp
            ? "Criar conta"
            : "Entrar"}
      </Button>
      <button
        type="button"
        onClick={() => navigate(isSignUp ? "/login" : "/signup")}
        className="mt-4 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar conta"}
      </button>
    </>
  );
}
