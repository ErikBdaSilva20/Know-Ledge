import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { KnowledgeLogo } from "./KnowledgeLogo";
import { Starfield } from "./Starfield";

// Shared shell for /login and /signup — 60% brand image (left), 40% form
// (right), plus the theme toggle every other screen already has via
// AppShell's header (login/signup sit outside AppShell, so without this
// they'd be the only screens where you can't switch theme).
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={theme === "dark" ? "Tema claro" : "Tema escuro"}
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        className="absolute right-4 top-4 z-10"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <div className="relative hidden shrink-0 items-center justify-center overflow-hidden bg-muted/30 lg:flex lg:w-[60%]">
        <Starfield />
        <KnowledgeLogo className="h-4/5 w-4/5 opacity-90" />
      </div>
      <div className="flex w-full min-w-0 items-center justify-center overflow-y-auto px-4 py-10 lg:w-[40%]">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
