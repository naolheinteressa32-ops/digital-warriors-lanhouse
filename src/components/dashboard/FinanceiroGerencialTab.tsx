import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import { useFinishedSessions } from "@/hooks/useFinishedSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateTime } from "@/lib/format";
import { Plus, Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line } from "recharts";

export function FinanceiroGerencialTab() {
  const { transactions, loading } = useFinancialTransactions();
  const { sessions } = useFinishedSessions(180);
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const [form, setForm] = useState({
    type: "expense",
    category: "operacional",
    description: "",
    amount: "",
    payment_method: "pix",
    occurred_at: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const sessionRevenue = useMemo(() => sessions.reduce((s, x) => s + Number(x.value) - Number(x.discount), 0), [sessions]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") income += Number(t.amount);
      else expense += Number(t.amount);
    });
    return { income: income + sessionRevenue, expense, profit: income + sessionRevenue - expense };
  }, [transactions, sessionRevenue]);

  const monthly = useMemo(() => {
    const map = new Map<string, { mes: string; receita: number; despesa: number }>();
    const ensure = (m: string) => {
      if (!map.has(m)) map.set(m, { mes: m, receita: 0, despesa: 0 });
      return map.get(m)!;
    };
    sessions.forEach((s) => {
      const m = (s.ended_at ?? s.started_at).slice(0, 7);
      ensure(m).receita += Number(s.value) - Number(s.discount);
    });
    transactions.forEach((t) => {
      const m = t.occurred_at.slice(0, 7);
      const row = ensure(m);
      if (t.type === "income") row.receita += Number(t.amount);
      else row.despesa += Number(t.amount);
    });
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6);
  }, [sessions, transactions]);

  const byDuration = useMemo(() => {
    const buckets = [
      { faixa: "≤30min", min: 0, max: 30, total: 0, count: 0 },
      { faixa: "31-60min", min: 31, max: 60, total: 0, count: 0 },
      { faixa: "61-120min", min: 61, max: 120, total: 0, count: 0 },
      { faixa: ">120min", min: 121, max: 9999, total: 0, count: 0 },
    ];
    sessions.forEach((s) => {
      const d = s.duration_minutes;
      const b = buckets.find((x) => d >= x.min && d <= x.max);
      if (b) { b.total += Number(s.value) - Number(s.discount); b.count += 1; }
    });
    return buckets;
  }, [sessions]);

  const filteredTx = useMemo(() => {
    return transactions.filter((t) => filterType === "all" || t.type === filterType);
  }, [transactions, filterType]);

  const handleCreate = async () => {
    if (!form.description || !form.amount) { toast.error("Descrição e valor são obrigatórios"); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("financial_transactions").insert({
      type: form.type,
      category: form.category,
      description: form.description,
      amount: Number(form.amount),
      payment_method: form.payment_method,
      occurred_at: new Date(form.occurred_at).toISOString(),
      notes: form.notes || null,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) toast.error("Erro", { description: error.message });
    else {
      toast.success("Lançamento registrado");
      setOpen(false);
      setForm({ ...form, description: "", amount: "", notes: "" });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="size-4 text-emerald-500" /> Receita total</div>
          <div className="text-2xl font-bold mt-1 text-emerald-500">{formatBRL(totals.income)}</div>
          <div className="text-xs text-muted-foreground mt-1">Sessões + receitas lançadas</div>
        </Card>
        <Card className="p-5 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown className="size-4 text-red-500" /> Despesas</div>
          <div className="text-2xl font-bold mt-1 text-red-500">{formatBRL(totals.expense)}</div>
        </Card>
        <Card className="p-5 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="size-4 text-primary" /> Lucro líquido</div>
          <div className={`text-2xl font-bold mt-1 ${totals.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatBRL(totals.profit)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 rounded-xl">
          <div className="font-semibold mb-3">Evolução mensal</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: number) => formatBRL(v)} />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="despesa" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 rounded-xl">
          <div className="font-semibold mb-3">Receita por duração de sessão</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDuration}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="faixa" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: number) => formatBRL(v)} />
                <Bar dataKey="total" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4 rounded-xl">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <Label className="text-xs">Tipo</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto"><Plus className="size-4 mr-1" /> Novo lançamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="energia">Energia</SelectItem>
                        <SelectItem value="internet">Internet</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Valor</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>Data</Label><Input type="date" value={form.occurred_at} onChange={(e) => setForm({ ...form, occurred_at: e.target.value })} /></div>
                </div>
                <div><Label>Forma de pagamento</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="size-4 mr-1 animate-spin" />}Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTx.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum lançamento.</TableCell></TableRow>
              ) : filteredTx.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{formatDateTime(t.occurred_at)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs ${t.type === "income" ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                      {t.type === "income" ? "Receita" : "Despesa"}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{t.category}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell className="uppercase text-xs">{t.payment_method ?? "—"}</TableCell>
                  <TableCell className={`text-right font-semibold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                    {t.type === "income" ? "+" : "−"} {formatBRL(Number(t.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
