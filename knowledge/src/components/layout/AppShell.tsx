import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  FolderTree,
  Home,
  Menu,
  Moon,
  Network,
  Search,
  Shield,
  Star,
  Sun,
  Timer,
} from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { isDevPreviewActive, setDevPreviewActive } from "@/lib/data/dataSource";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  managerOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/workspace", label: "Meu Workspace", icon: FolderTree },
  { to: "/shared", label: "Base Compartilhada", icon: BookOpen },
  { to: "/search", label: "Busca", icon: Search },
  { to: "/graph", label: "Grafo", icon: Network },
  { to: "/favorites", label: "Favoritos", icon: Star },
  { to: "/recent", label: "Recentes", icon: Timer },
  { to: "/admin", label: "Administração", icon: Shield, managerOnly: true },
];

const COLLAPSE_KEY = "kv:sidebar:collapsed:v1";

function SidebarInner({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { can } = useSession();
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "gap-2 px-4",
        )}
      >
        <Compass className="h-5 w-5 shrink-0 text-primary" />
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-semibold tracking-tight">Knowledge Vault</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Base interna
            </span>
          </div>
        )}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-7 w-7 md:inline-flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-0.5">
          {NAV.filter((n) => !n.managerOnly || can("publishShared")).map((item) => {
            const active =
              pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-md text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed ? "justify-center px-2 py-2" : "gap-2 px-2.5 py-1.5",
                    active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-1" : "p-2")}>
        {collapsed ? (
          <div className="flex items-center justify-center py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Compass className="h-4 w-4" />
          </div>
        ) : (
          <RoleSwitcher />
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, setUserId } = useSession();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <SidebarInner collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SidebarInner onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/60 px-3 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {user ? (
              <>
                <span className="hidden sm:inline">Sessão como </span>
                <span className="font-medium text-foreground">{user.name}</span>
                <span className="mx-1.5 text-muted-foreground/60">·</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                  {user.role}
                </span>
              </>
            ) : (
              "Sem sessão"
            )}
          </div>
          {isDevPreviewActive() && (
            <button
              type="button"
              onClick={() => {
                setDevPreviewActive(false);
                setUserId(null);
                window.location.href = "/login";
              }}
              title="Sair do preview mockado e voltar ao gateway real"
              className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
            >
              <Eye className="h-3 w-3" />
              Preview mock · voltar ao gateway
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={theme === "dark" ? "Tema claro" : "Tema escuro"}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
