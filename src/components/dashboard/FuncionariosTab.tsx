import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfiles } from "@/hooks/useProfiles";
import { useFinishedSessions } from "@/hooks/useFinishedSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateTime } from "@/lib/format";
import { UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile, UserRole } from "@/types";

export function FuncionariosTab() {
  const { profiles, loading } = useProfiles();
  const { sessions } = useFinishedSessions(30);
  const { user, role } = useAuth();
  const canManage = role === "manager";
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const byAttendant = useMemo(() => {
    const m = new Map<string, { count: number; revenue: number }>();
    for (const s of sessions) {
      const cur = m.get(s.attendant_id) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(s.value) - Number(s.discount);
      m.set(s.attendant_id, cur);
    }
    return m;
  }, [sessions]);

  const toggleActive = async (p: Profile, active: boolean) => {
    if (p.id === user?.id && !active) { toast.error("Você não pode desativar a si mesmo"); return; }
    setUpdatingId(p.id);
    const { error } = await supabase.from("profiles").update({ active }).eq("id", p.id);
    setUpdatingId(null);
    if (error) toast.error("Erro", { description: error.message });
    else toast.success(active ? "Funcionário ativado" : "Funcionário desativado");
  };

  const changeRole = async (p: Profile, newRole: UserRole) => {
    if (p.id === user?.id && newRole !== "manager") { toast.error("Você não pode rebaixar a si mesmo"); return; }
    setUpdatingId(p.id);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", p.id);
    setUpdatingId(null);
    if (error) toast.error("Erro", { description: error.message });
    else toast.success("Cargo atualizado");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (profiles.length === 0) return <Card className="p-12 rounded-xl text-center text-muted-foreground">Nenhum funcionário cadastrado.</Card>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((p) => {
        const stats = byAttendant.get(p.id);
        const busy = updatingId === p.id;
        return (
          <Card key={p.id} className={`p-5 rounded-xl space-y-3 ${p.active ? "" : "opacity-60"}`}>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center"><UserCog className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{p.role === "manager" ? "Gerente" : "Atendente"} • {p.active ? "Ativo" : "Inativo"}</div>
              </div>
              {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="text-sm space-y-1 border-t border-border pt-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Sessões (30d):</span><span className="font-medium">{stats?.count ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Receita gerada:</span><span className="font-medium">{formatBRL(stats?.revenue ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cadastrado:</span><span className="text-xs">{formatDateTime(p.created_at)}</span></div>
            </div>
            {canManage && (
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ativo</span>
                  <Switch checked={p.active} disabled={busy} onCheckedChange={(v) => toggleActive(p, v)} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">Cargo</span>
                  <Select value={p.role} disabled={busy} onValueChange={(v) => changeRole(p, v as UserRole)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attendant">Atendente</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
