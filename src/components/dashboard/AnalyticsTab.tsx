import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useFinishedSessions } from "@/hooks/useFinishedSessions";
import { useEquipments } from "@/hooks/useEquipments";
import { formatBRL } from "@/lib/format";
import { Loader2, Trophy, Clock, Activity, Monitor, Gamepad2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

const HOURS_IN_DAY = 24;

export function AnalyticsTab() {
  const { sessions, loading } = useFinishedSessions(30);
  const { equipments } = useEquipments();

  const stats = useMemo(() => {
    // Equipment ranking and revenue per equipment
    const byEquip = new Map<string, { id: string; name: string; type: string; count: number; minutes: number; revenue: number }>();
    for (const e of equipments) byEquip.set(e.id, { id: e.id, name: e.name, type: e.type, count: 0, minutes: 0, revenue: 0 });
    let totalMinutes = 0;
    let totalSessions = 0;
    for (const s of sessions) {
      const cur = byEquip.get(s.equipment_id);
      const net = Number(s.value) - Number(s.discount);
      const mins = Number(s.duration_minutes) || 0;
      totalMinutes += mins;
      totalSessions += 1;
      if (cur) { cur.count += 1; cur.minutes += mins; cur.revenue += net; }
    }
    const ranking = [...byEquip.values()].sort((a, b) => b.count - a.count);

    // Occupancy rate over the last 30 days: used_minutes / (equipments * 30 days * open_hours)
    // Assume 12h open per day for ocupação reference.
    const OPEN_HOURS_PER_DAY = 12;
    const capacityMinutes = Math.max(1, equipments.length * 30 * OPEN_HOURS_PER_DAY * 60);
    const occupancy = Math.min(100, (totalMinutes / capacityMinutes) * 100);

    // Peak hours
    const hours = Array.from({ length: HOURS_IN_DAY }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}h`, sessions: 0 }));
    for (const s of sessions) {
      const h = new Date(s.started_at).getHours();
      hours[h].sessions += 1;
    }

    const avgSession = totalSessions > 0 ? totalMinutes / totalSessions : 0;

    return { ranking, occupancy, hours, avgSession, totalSessions };
  }, [sessions, equipments]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Activity} label="Taxa de ocupação (30d)" value={`${stats.occupancy.toFixed(1)}%`} />
        <Stat icon={Clock} label="Tempo médio de sessão" value={`${Math.round(stats.avgSession)} min`} />
        <Stat icon={Trophy} label="Equipamento top" value={stats.ranking[0]?.name ?? "—"} />
        <Stat icon={Activity} label="Sessões (30d)" value={String(stats.totalSessions)} />
      </div>

      <Card className="p-5 rounded-xl">
        <div className="text-sm font-semibold mb-3">Ranking de equipamentos por uso (30 dias)</div>
        {stats.ranking.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
        ) : (
          <div className="space-y-2">
            {stats.ranking.slice(0, 10).map((e, i) => (
              <div key={e.id} className="flex items-center gap-3">
                <div className="w-6 text-xs text-muted-foreground tabular-nums">#{i + 1}</div>
                {e.type === "computer" ? <Monitor className="size-4 text-primary" /> : <Gamepad2 className="size-4 text-accent" />}
                <div className="flex-1 min-w-0 truncate text-sm font-medium">{e.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{e.count} sessões</div>
                <div className="text-sm font-medium tabular-nums w-24 text-right">{formatBRL(e.revenue)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 rounded-xl">
        <div className="text-sm font-semibold mb-3">Receita por equipamento</div>
        {stats.ranking.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.ranking.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-5 rounded-xl">
        <div className="text-sm font-semibold mb-3">Horários de maior movimento</div>
        {stats.totalSessions === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.hours}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-5 rounded-xl">
      <div className="text-sm text-muted-foreground flex items-center gap-2"><Icon className="size-4" /> {label}</div>
      <div className="text-2xl font-bold mt-2 truncate">{value}</div>
    </Card>
  );
}
