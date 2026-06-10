import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useProfiles } from "@/hooks/useProfiles";
import { useFinishedSessions } from "@/hooks/useFinishedSessions";
import { formatBRL, formatDateTime } from "@/lib/format";
import { UserCog, Loader2 } from "lucide-react";

export function FuncionariosTab() {
  const { profiles, loading } = useProfiles();
  const { sessions } = useFinishedSessions(30);

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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (profiles.length === 0) return <Card className="p-12 rounded-xl text-center text-muted-foreground">Nenhum funcionário.</Card>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((p) => {
        const stats = byAttendant.get(p.id);
        return (
          <Card key={p.id} className="p-5 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center"><UserCog className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{p.role === "manager" ? "Gerente" : "Atendente"} • {p.active ? "Ativo" : "Inativo"}</div>
              </div>
            </div>
            <div className="text-sm space-y-1 border-t border-border pt-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Sessões (30d):</span><span className="font-medium">{stats?.count ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Receita gerada:</span><span className="font-medium">{formatBRL(stats?.revenue ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cadastrado:</span><span className="text-xs">{formatDateTime(p.created_at)}</span></div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
