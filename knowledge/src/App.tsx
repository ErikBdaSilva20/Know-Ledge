import { Component, useEffect, type ReactNode } from "react";
import { Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { reportLovableError } from "./lib/lovable-error-reporting";
import { useSession } from "./lib/session";
import { AppShell } from "./components/layout/AppShell";

import { LoginPage } from "./routes/login";
import { SignUpPage } from "./routes/signup";
import { Dashboard } from "./routes/dashboard";
import { WorkspaceLayout } from "./routes/workspace";
import { WorkspaceIndex } from "./routes/workspace-index";
import { WorkspaceDoc } from "./routes/workspace-doc";
import { SharedLayout } from "./routes/shared";
import { SharedIndex } from "./routes/shared-index";
import { SharedDoc } from "./routes/shared-doc";
import { SearchPage } from "./routes/search";
import { GraphPage } from "./routes/graph";
import { FavoritesPage } from "./routes/favorites";
import { RecentPage } from "./routes/recent";
import { AdminPage } from "./routes/admin";
import { HelpPage } from "./routes/help";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">Página não encontrada.</p>
        <a href="/" className="mt-6 inline-block text-sm text-primary hover:underline">
          Voltar ao início
        </a>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  error: Error | null;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    reportLovableError(error, { boundary: "root_error_boundary" });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Erro ao carregar a página</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

/** Redirects unauthenticated users to /login, and authenticated users away from /login or /signup. */
function RequireAuth() {
  const { user } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !PUBLIC_PATHS.has(location.pathname)) {
      navigate("/login", { replace: true });
    } else if (user && (PUBLIC_PATHS.has(location.pathname) || location.pathname === "/")) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return <Outlet />;
}

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export function App() {
  return (
    <RootErrorBoundary>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/" element={null} />
          <Route element={<ShellLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workspace" element={<WorkspaceLayout />}>
              <Route index element={<WorkspaceIndex />} />
              <Route path=":docId" element={<WorkspaceDoc />} />
            </Route>
            <Route path="/shared" element={<SharedLayout />}>
              <Route index element={<SharedIndex />} />
              <Route path=":docId" element={<SharedDoc />} />
            </Route>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/recent" element={<RecentPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/ajuda" element={<HelpPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RootErrorBoundary>
  );
}
