import { useEffect, useState, type ReactNode } from "react";
import { ChevronsLeft, ChevronsRight, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  storageKey: string;
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Force-hide the side nav (e.g. on mobile when a doc is open) */
  hidden?: boolean;
  /** Called with current collapsed state to allow parent width control */
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

/**
 * Reusable collapsible side navigation shell.
 * Provides: persistent collapse state, collapsed rail (icon), header (title + actions),
 * and a scrollable content area.
 */
export function SideNavShell({
  storageKey,
  title,
  icon,
  actions,
  children,
  hidden,
  onCollapsedChange,
  className,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
    onCollapsedChange?.(collapsed);
  }, [collapsed, storageKey, onCollapsedChange]);

  if (hidden) return null;

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 w-10 flex-col items-center border-r border-border bg-muted/30 py-2",
          className,
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(false)}
          aria-label="Expandir"
          title="Expandir"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <div className="mt-2 text-muted-foreground">
          {icon ?? <PanelLeft className="h-4 w-4" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col border-r border-border bg-muted/30", className)}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {icon}
          {title}
        </span>
        <div className="flex gap-1">
          {actions}
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-6 w-6 md:inline-flex"
            onClick={() => setCollapsed(true)}
            title="Recolher"
            aria-label="Recolher"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
