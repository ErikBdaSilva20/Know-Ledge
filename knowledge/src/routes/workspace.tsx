import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Explorer } from "@/components/Explorer";
import { cn } from "@/lib/utils";

export function WorkspaceLayout() {
  const { pathname } = useLocation();
  const hasDoc = pathname.startsWith("/workspace/") && pathname !== "/workspace/";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "grid h-full grid-cols-1",
        collapsed ? "md:grid-cols-[40px_1fr]" : "md:grid-cols-[280px_1fr]",
      )}
    >
      <div className={cn("min-h-0", hasDoc && "hidden md:block")}>
        <Explorer hidden={false} onCollapsedChange={setCollapsed} />
      </div>
      <div className={cn("flex min-w-0 flex-col", !hasDoc && "hidden md:flex")}>
        <Outlet />
      </div>
    </div>
  );
}
