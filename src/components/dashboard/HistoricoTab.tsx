import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinishedSessions } from "@/hooks/useFinishedSessions";
import { formatBRL, formatDateTime } from "@/lib/format";
import { Download, Loader2, Search } from "lucide-react";
import { downloadCSV } from "@/lib/csv";

type Range = "7" | "30" | "90";

export function HistoricoTab() {
  const [range, setRange] = useState<Range>("30");
  const { sessions, loading } = useFinishedSessions(Number(range));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "computer" | "console">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (typeFilter !== "all" && s.equipment_type !== typeFilter) return false;
      if (q) {
        const hay = `${s.customer_name ?? ""} ${s.equipment_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, search, typeFilter]);

  const exportCSV = () => {
    const rows = filtered.map((s) => ({
      data: s.started_at,
      fim: s.ended_at ?? "",
      equipamento: s.equipment_name ?? "",
      tipo: s.equipment_type === "computer" ? "PC" : "Console",
      cliente: s.customer_name ?? "Avulso",
      duracao_min: s.duration_minutes,
      valor: Number(s.value).toFixed(2),
      desconto: Number(s.discount).toFixed(2),
      liquido: (Number(s.value) - Number(s.discount)).toFixed(2),
      pagamento: s.payment_method ?? "",
    }));
    downloadCSV(`historico-${range}d-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList>
              <TabsTrigger value="7">7d</TabsTrigger>
              <TabsTrigger value="30">30d</TabsTrigger>
              <TabsTrigger value="90">90d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="computer">PCs</TabsTrigger>
              <TabsTrigger value="console">Videogames</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input className="pl-9 w-64" placeholder="Cliente ou equipamento..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" className="rounded-lg" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="size-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 rounded-xl text-center text-muted-foreground">Nenhuma sessão encontrada.</Card>
      ) : (
        <Card className="rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Início</th>
                  <th className="text-left p-3">Equipamento</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-right p-3">Duração</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-right p-3">Líquido</th>
                  <th className="text-left p-3">Pgto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{formatDateTime(s.started_at)}</td>
                    <td className="p-3">{s.equipment_name}</td>
                    <td className="p-3">{s.customer_name ?? "Avulso"}</td>
                    <td className="p-3 text-right">{s.duration_minutes} min</td>
                    <td className="p-3 text-right">{formatBRL(Number(s.value))}</td>
                    <td className="p-3 text-right font-medium">{formatBRL(Number(s.value) - Number(s.discount))}</td>
                    <td className="p-3 text-xs uppercase">{s.payment_method ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
