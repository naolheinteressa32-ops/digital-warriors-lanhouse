import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Monitor, LayoutDashboard, LogOut, Users, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: ("attendant" | "manager")[]; }

const NAV: NavItem[] = [
  { to: "/atendente", label: "Atendimento", icon: LayoutDashboard, roles: ["attendant", "manager"] },
  { to: "/clientes", label: "Clientes", icon: Users, roles: ["attendant", "manager"] },
  { to: "/gerente", label: "Gerência", icon: BarChart3, roles: ["manager"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = NAV.filter((n) => role && n.roles.includes(role));
  const initial = profile?.name?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2">
          <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Monitor className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-bold leading-tight">CyberLAN</div>
            <div className="text-xs text-muted-foreground">Manager</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{profile?.name}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {role === "manager" ? "Gerente" : "Atendente"}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start mt-2 rounded-lg" onClick={handleSignOut}>
            <LogOut className="size-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">{children}</main>
        <footer className="text-xs text-muted-foreground px-6 py-3 border-t border-border">
          CyberLAN © 2026
        </footer>
      </div>
    </div>
  );
}
