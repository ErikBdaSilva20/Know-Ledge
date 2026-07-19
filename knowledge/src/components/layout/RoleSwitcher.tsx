import { useSession } from "@/lib/session";
import { useDb } from "@/lib/useDb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, RotateCcw, User as UserIcon } from "lucide-react";
import { resetDb } from "@/lib/mockDb";

export function RoleSwitcher() {
  const { user, setUserId } = useSession();
  const users = useDb((s) => s.users);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {user ? user.name.slice(0, 1) : "?"}
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-xs font-medium">{user?.name ?? "Sem usuário"}</span>
          <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
            {user?.role ?? "—"}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>Trocar de usuário</DropdownMenuLabel>
        {users.map((u) => (
          <DropdownMenuItem key={u.id} onSelect={() => setUserId(u.id)}>
            <UserIcon className="mr-2 h-3.5 w-3.5" />
            <span className="flex-1">{u.name}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{u.role}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            resetDb();
          }}
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Recriar dados de exemplo
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setUserId(null)}>
          <LogOut className="mr-2 h-3.5 w-3.5" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
