import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LayoutDashboard, LogOut, Users, BarChart3, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "./ThemeToggle";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.filter((n) => role && n.roles.includes(role));
  const initial = profile?.name?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/login", replace: true });
  };

  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="px-5 py-5 border-b border-border flex items-center gap-2">
        <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center overflow-hidden shrink-0">
          <img src={logo} alt="Digital Warriors" className="size-8 object-contain" width={32} height={32} />
        </div>
        <div className="min-w-0">
          <div className="font-bold leading-tight truncate">Digital Warriors</div>
          <div className="text-xs text-muted-foreground">Manager</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}>
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold shrink-0">
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
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-border flex-col">
        <SidebarBody />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background/95 backdrop-blur">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Digital Warriors" className="size-7 object-contain" width={28} height={28} />
            <span className="font-bold truncate">Digital Warriors</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Desktop top-right theme toggle */}
        <div className="hidden md:flex items-center justify-end px-4 py-2 border-b border-border">
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
        <footer className="text-xs text-muted-foreground px-6 py-3 border-t border-border">
          Digital Warriors © 2026
        </footer>
      </div>
    </div>
  );
}
