import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useFinishedSessions } from "@/hooks/useFinishedSessions";
import { useEquipments } from "@/hooks/useEquipments";
import { useActiveSessions } from "@/hooks/useSessions";
import { useCustomers } from "@/hooks/useCustomers";
import { formatBRL } from "@/lib/format";
import { Monitor, Gamepad2, Users, TrendingUp, Activity, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

export function OverviewManager() {
  const { sessions, loading } = useFinishedSessions(30);
  const { equipments } = useEquipments();
  const { sessions: active } = useActiveSessions();
  const { customers } = useCustomers();

  const data = useMemo(() => {
    const pcRevenue = sessions.filter((s) => s.equipment_type === "computer").reduce((sum, s) => sum + Number(s.value) - Number(s.discount), 0);
    const conRevenue = sessions.filter((s) => s.equipment_type === "console").reduce((sum, s) => sum + Number(s.value) - Number(s.discount), 0);
    const total = pcRevenue + conRevenue;

    // Daily revenue last 14 days
    const days: { day: string; PCs: number; Videogames: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const inDay = sessions.filter((s) => {
        const t = new Date(s.started_at).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      days.push({
        day: dayLabel,
        PCs: inDay.filter((s) => s.equipment_type === "computer").reduce((sum, s) => sum + Number(s.value) - Number(s.discount), 0),
        Videogames: inDay.filter((s) => s.equipment_type === "console").reduce((sum, s) => sum + Number(s.value) - Number(s.discount), 0),
      });
    }

    const pie = [
      { name: "PCs", value: pcRevenue },
      { name: "Videogames", value: conRevenue },
    ].filter((x) => x.value > 0);

    return { pcRevenue, conRevenue, total, days, pie };
  }, [sessions]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={TrendingUp} label="Receita 30 dias" value={formatBRL(data.total)} />
        <Stat icon={Monitor} label="Receita PCs" value={formatBRL(data.pcRevenue)} />
        <Stat icon={Gamepad2} label="Receita Videogames" value={formatBRL(data.conRevenue)} />
        <Stat icon={Activity} label="Sessões ativas" value={String(active.length)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Users} label="Clientes" value={String(customers.length)} />
        <Stat icon={Monitor} label="PCs" value={String(equipments.filter((e) => e.type === "computer").length)} />
        <Stat icon={Gamepad2} label="Consoles" value={String(equipments.filter((e) => e.type === "console").length)} />
        <Stat icon={Activity} label="Sessões finalizadas" value={String(sessions.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 rounded-xl lg:col-span-2">
          <div className="text-sm font-semibold mb-3">Receita diária (últimos 14 dias)</div>
          {data.days.every((d) => d.PCs === 0 && d.Videogames === 0) ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sem dados no período.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => formatBRL(v)} />
                <Legend />
                <Bar dataKey="PCs" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="Videogames" stackId="a" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="p-5 rounded-xl">
          <div className="text-sm font-semibold mb-3">Mix de receita</div>
          {data.pie.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {data.pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-5 rounded-xl">
      <div className="text-sm text-muted-foreground flex items-center gap-2"><Icon className="size-4" /> {label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </Card>
  );
}
