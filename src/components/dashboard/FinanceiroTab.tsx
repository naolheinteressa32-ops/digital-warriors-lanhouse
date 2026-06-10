import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinishedSessions } from "@/hooks/useFinishedSessions";
import { formatBRL } from "@/lib/format";
import { Download, Loader2, TrendingUp, Monitor, Gamepad2 } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

type Range = "7" | "30" | "90";

export function FinanceiroTab() {
  const [range, setRange] = useState<Range>("30");
  const days = Number(range);
  const { sessions, loading, error } = useFinishedSessions(days);

  const data = useMemo(() => {
    const pc = sessions.filter((s) => s.equipment_type === "computer");
    const co = sessions.filter((s) => s.equipment_type === "console");
    const sumVal = (arr: typeof sessions) => arr.reduce((s, x) => s + Number(x.value) - Number(x.discount), 0);
    const pcRevenue = sumVal(pc);
    const coRevenue = sumVal(co);
    const total = pcRevenue + coRevenue;
    const totalDiscount = sessions.reduce((s, x) => s + Number(x.discount), 0);
    const ticket = sessions.length ? total / sessions.length : 0;

    // group by day
    const daily: Record<string, { day: string; PCs: number; Videogames: number; total: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      daily[key] = { day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), PCs: 0, Videogames: 0, total: 0 };
    }
    for (const s of sessions) {
      const key = new Date(s.started_at).toISOString().slice(0, 10);
      if (!daily[key]) continue;
      const v = Number(s.value) - Number(s.discount);
      if (s.equipment_type === "computer") daily[key].PCs += v;
      else daily[key].Videogames += v;
      daily[key].total += v;
    }
    const series = Object.values(daily);

    // Payment method breakdown
    const byMethod: Record<string, number> = {};
    for (const s of sessions) {
      const m = s.payment_method ?? "—";
      byMethod[m] = (byMethod[m] ?? 0) + Number(s.value) - Number(s.discount);
    }
    const methods = Object.entries(byMethod).map(([name, value]) => ({ name, value }));

    return { pcRevenue, coRevenue, total, totalDiscount, ticket, series, methods };
  }, [sessions, days]);

  const exportCSV = () => {
    const rows = sessions.map((s) => ({
      id: s.id,
      data: s.started_at,
      equipamento: s.equipment_name ?? "",
      tipo: s.equipment_type === "computer" ? "PC" : "Console",
      cliente: s.customer_name ?? "Avulso",
      duracao_min: s.duration_minutes,
      valor: Number(s.value).toFixed(2),
      desconto: Number(s.discount).toFixed(2),
      liquido: (Number(s.value) - Number(s.discount)).toFixed(2),
      pagamento: s.payment_method ?? "",
    }));
    downloadCSV(`financeiro-${days}d-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="7">7 dias</TabsTrigger>
            <TabsTrigger value="30">30 dias</TabsTrigger>
            <TabsTrigger value="90">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" className="rounded-lg" onClick={exportCSV} disabled={sessions.length === 0}>
          <Download className="size-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {error && <Card className="p-4 rounded-xl border-destructive text-destructive">{error}</Card>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat icon={TrendingUp} label="Receita total" value={formatBRL(data.total)} />
            <Stat icon={Monitor} label="Receita PCs" value={formatBRL(data.pcRevenue)} />
            <Stat icon={Gamepad2} label="Receita Videogames" value={formatBRL(data.coRevenue)} />
            <Stat icon={TrendingUp} label="Ticket médio" value={formatBRL(data.ticket)} />
          </div>
          <Card className="p-5 rounded-xl">
            <div className="text-sm font-semibold mb-3">Receita diária por categoria</div>
            {sessions.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sem sessões no período.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => formatBRL(v)} />
                  <Legend />
                  <Bar dataKey="PCs" fill="hsl(var(--primary))" />
                  <Bar dataKey="Videogames" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card className="p-5 rounded-xl">
            <div className="text-sm font-semibold mb-3">Tendência (líquido)</div>
            {sessions.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => formatBRL(v)} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card className="p-5 rounded-xl">
            <div className="text-sm font-semibold mb-3">Por forma de pagamento</div>
            {data.methods.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.methods.map((m) => (
                  <div key={m.name} className="p-3 rounded-lg bg-muted/30">
                    <div className="text-xs text-muted-foreground uppercase">{m.name}</div>
                    <div className="font-semibold mt-1">{formatBRL(m.value)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
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
