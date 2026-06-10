import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinishedSessions } from "@/hooks/useFinishedSessions";
import { useEquipments } from "@/hooks/useEquipments";
import { useCustomers } from "@/hooks/useCustomers";
import { formatBRL } from "@/lib/format";
import { Download, FileText, Loader2 } from "lucide-react";
import { downloadCSV } from "@/lib/csv";

export function RelatoriosTab() {
  const { sessions, loading } = useFinishedSessions(90);
  const { equipments } = useEquipments();
  const { customers } = useCustomers();

  const reports = useMemo(() => {
    // Por equipamento
    const byEquip = new Map<string, { name: string; type: string; count: number; revenue: number; minutes: number }>();
    for (const s of sessions) {
      const k = s.equipment_id;
      const cur = byEquip.get(k) ?? { name: s.equipment_name ?? "—", type: s.equipment_type ?? "—", count: 0, revenue: 0, minutes: 0 };
      cur.count += 1;
      cur.revenue += Number(s.value) - Number(s.discount);
      cur.minutes += s.duration_minutes;
      byEquip.set(k, cur);
    }
    const equipRows = Array.from(byEquip.values()).sort((a, b) => b.revenue - a.revenue);

    // Por cliente
    const byCust = new Map<string, { name: string; count: number; revenue: number }>();
    for (const s of sessions) {
      const k = s.customer_id ?? "avulso";
      const cur = byCust.get(k) ?? { name: s.customer_name ?? "Avulso", count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(s.value) - Number(s.discount);
      byCust.set(k, cur);
    }
    const custRows = Array.from(byCust.values()).sort((a, b) => b.revenue - a.revenue);

    // Por tipo
    const pc = sessions.filter((s) => s.equipment_type === "computer");
    const co = sessions.filter((s) => s.equipment_type === "console");
    const typeRows = [
      { tipo: "Computadores", sessoes: pc.length, receita: pc.reduce((s, x) => s + Number(x.value) - Number(x.discount), 0) },
      { tipo: "Videogames", sessoes: co.length, receita: co.reduce((s, x) => s + Number(x.value) - Number(x.discount), 0) },
    ];

    return { equipRows, custRows, typeRows };
  }, [sessions]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <ReportCard
        title="Relatório por equipamento (90d)"
        empty={reports.equipRows.length === 0}
        onExport={() => downloadCSV("relatorio-equipamentos.csv", reports.equipRows.map((r) => ({
          equipamento: r.name, tipo: r.type, sessoes: r.count, minutos: r.minutes, receita: r.revenue.toFixed(2),
        })))}
      >
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-2">Equipamento</th><th className="text-left p-2">Tipo</th><th className="text-right p-2">Sessões</th><th className="text-right p-2">Min.</th><th className="text-right p-2">Receita</th></tr>
          </thead>
          <tbody>
            {reports.equipRows.map((r, i) => (
              <tr key={i} className="border-t border-border"><td className="p-2">{r.name}</td><td className="p-2">{r.type === "computer" ? "PC" : "Console"}</td><td className="p-2 text-right">{r.count}</td><td className="p-2 text-right">{r.minutes}</td><td className="p-2 text-right font-medium">{formatBRL(r.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      </ReportCard>

      <ReportCard
        title="Relatório por cliente (90d)"
        empty={reports.custRows.length === 0}
        onExport={() => downloadCSV("relatorio-clientes.csv", reports.custRows.map((r) => ({
          cliente: r.name, sessoes: r.count, receita: r.revenue.toFixed(2),
        })))}
      >
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-2">Cliente</th><th className="text-right p-2">Sessões</th><th className="text-right p-2">Total gasto</th></tr>
          </thead>
          <tbody>
            {reports.custRows.slice(0, 50).map((r, i) => (
              <tr key={i} className="border-t border-border"><td className="p-2">{r.name}</td><td className="p-2 text-right">{r.count}</td><td className="p-2 text-right font-medium">{formatBRL(r.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      </ReportCard>

      <ReportCard
        title="Receita por categoria (90d)"
        empty={reports.typeRows.every((r) => r.sessoes === 0)}
        onExport={() => downloadCSV("relatorio-categorias.csv", reports.typeRows.map((r) => ({ tipo: r.tipo, sessoes: r.sessoes, receita: r.receita.toFixed(2) })))}
      >
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-2">Categoria</th><th className="text-right p-2">Sessões</th><th className="text-right p-2">Receita</th></tr>
          </thead>
          <tbody>
            {reports.typeRows.map((r, i) => (
              <tr key={i} className="border-t border-border"><td className="p-2">{r.tipo}</td><td className="p-2 text-right">{r.sessoes}</td><td className="p-2 text-right font-medium">{formatBRL(r.receita)}</td></tr>
            ))}
          </tbody>
        </table>
      </ReportCard>

      <Card className="p-4 rounded-xl flex items-center justify-between">
        <div className="text-sm flex items-center gap-2"><FileText className="size-4" /> Exportar inventário completo</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => downloadCSV("equipamentos.csv", equipments.map((e) => ({
            nome: e.name, tipo: e.type, specs: e.specs ?? "", valor_hora: Number(e.hourly_rate).toFixed(2), status: e.status,
          })))}><Download className="size-4 mr-2" /> Equipamentos</Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => downloadCSV("clientes.csv", customers.map((c) => ({
            nome: c.name, cpf: c.cpf ?? "", telefone: c.phone ?? "", email: c.email ?? "",
          })))}><Download className="size-4 mr-2" /> Clientes</Button>
        </div>
      </Card>
    </div>
  );
}

function ReportCard({ title, children, onExport, empty }: { title: string; children: React.ReactNode; onExport: () => void; empty: boolean }) {
  return (
    <Card className="p-5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">{title}</div>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={onExport} disabled={empty}>
          <Download className="size-4 mr-2" /> CSV
        </Button>
      </div>
      {empty ? <div className="text-sm text-muted-foreground py-8 text-center">Sem dados.</div> : <div className="overflow-x-auto">{children}</div>}
    </Card>
  );
}
