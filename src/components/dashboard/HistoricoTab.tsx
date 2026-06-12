import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { formatBRL, formatDateTime } from "@/lib/format";
import { Download, Loader2, Search } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import type { SessionStatus } from "@/types";

type Range = "7" | "30" | "90";

const STATUS_LABEL: Record<SessionStatus, string> = {
  active: "Ativa",
  finished: "Finalizada",
  cancelled: "Cancelada",
};

const STATUS_VARIANT: Record<SessionStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  finished: "secondary",
  cancelled: "destructive",
};

export function HistoricoTab() {
  const [range, setRange] = useState<Range>("30");
  const { sessions, loading } = useSessionHistory(Number(range));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "computer" | "console">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SessionStatus>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const customerOptions = useMemo(() => {
    const set = new Map<string, string>();
    sessions.forEach((s) => { if (s.customer_name) set.set(s.customer_name, s.customer_name); });
    return Array.from(set.keys()).sort();
  }, [sessions]);

  const equipmentOptions = useMemo(() => {
    const set = new Map<string, string>();
    sessions.forEach((s) => { if (s.equipment_name) set.set(s.equipment_name, s.equipment_name); });
    return Array.from(set.keys()).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (typeFilter !== "all" && s.equipment_type !== typeFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (customerFilter !== "all" && (s.customer_name ?? "Avulso") !== customerFilter) return false;
      if (equipmentFilter !== "all" && s.equipment_name !== equipmentFilter) return false;
      if (dateFilter) {
        const d = new Date(s.started_at).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }
      if (q) {
        const hay = `${s.customer_name ?? ""} ${s.equipment_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, search, typeFilter, statusFilter, customerFilter, equipmentFilter, dateFilter]);

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
      status: s.status,
    }));
    downloadCSV(`historico-${range}d-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const clearFilters = () => {
    setSearch(""); setTypeFilter("all"); setStatusFilter("all");
    setCustomerFilter("all"); setEquipmentFilter("all"); setDateFilter("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
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
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input className="pl-9 w-64" placeholder="Buscar cliente ou equipamento..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" className="rounded-lg" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="size-4 mr-2" /> CSV
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="finished">Finalizada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {customerOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Equipamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os equipamentos</SelectItem>
              {equipmentOptions.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-44" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
          <div className="text-xs text-muted-foreground ml-auto">{filtered.length} sessão(ões)</div>
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
                  <th className="text-left p-3">Término</th>
                  <th className="text-left p-3">Equipamento</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-right p-3">Duração</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-left p-3">Pgto</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{formatDateTime(s.started_at)}</td>
                    <td className="p-3 whitespace-nowrap">{s.ended_at ? formatDateTime(s.ended_at) : "—"}</td>
                    <td className="p-3">{s.equipment_name}</td>
                    <td className="p-3 text-xs">{s.equipment_type === "computer" ? "PC" : "Console"}</td>
                    <td className="p-3">{s.customer_name ?? "Avulso"}</td>
                    <td className="p-3 text-right">{s.duration_minutes} min</td>
                    <td className="p-3 text-right font-medium">{formatBRL(Number(s.value) - Number(s.discount))}</td>
                    <td className="p-3 text-xs uppercase">{s.payment_method ?? "—"}</td>
                    <td className="p-3"><Badge variant={STATUS_VARIANT[s.status as SessionStatus]}>{STATUS_LABEL[s.status as SessionStatus]}</Badge></td>
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
