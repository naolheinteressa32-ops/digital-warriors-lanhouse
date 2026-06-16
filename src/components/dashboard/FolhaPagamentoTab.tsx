import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePayroll } from "@/hooks/usePayroll";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FolhaPagamentoTab() {
  const { records, loading } = usePayroll();
  const { profiles } = useProfiles();
  const { user, role } = useAuth();
  const isManager = role === "manager";
  const [open, setOpen] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    employee_id: "",
    reference_month: new Date().toISOString().slice(0, 7),
    base_amount: "",
    bonus: "0",
    deductions: "0",
    payment_method: "pix",
    status: "pending",
    notes: "",
  });

  const profileById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [profiles]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterEmployee !== "all" && r.employee_id !== filterEmployee) return false;
      if (filterMonth && !r.reference_month.startsWith(filterMonth)) return false;
      if (!isManager && r.employee_id !== user?.id) return false;
      return true;
    });
  }, [records, filterEmployee, filterMonth, isManager, user?.id]);

  const totals = useMemo(() => {
    let paid = 0, pending = 0;
    filtered.forEach((r) => {
      if (r.status === "paid") paid += Number(r.net_amount);
      else pending += Number(r.net_amount);
    });
    return { paid, pending };
  }, [filtered]);

  const handleCreate = async () => {
    if (!form.employee_id || !form.base_amount) {
      toast.error("Funcionário e valor base são obrigatórios");
      return;
    }
    setSaving(true);
    const base = Number(form.base_amount) || 0;
    const bonus = Number(form.bonus) || 0;
    const deductions = Number(form.deductions) || 0;
    const net = base + bonus - deductions;
    const { error } = await (supabase as any).from("payroll_records").insert({
      employee_id: form.employee_id,
      reference_month: `${form.reference_month}-01`,
      base_amount: base,
      bonus,
      deductions,
      net_amount: net,
      payment_method: form.payment_method,
      status: form.status,
      notes: form.notes || null,
      paid_at: form.status === "paid" ? new Date().toISOString() : null,
      paid_by: form.status === "paid" ? user?.id : null,
    });
    setSaving(false);
    if (error) toast.error("Erro", { description: error.message });
    else {
      toast.success("Registro de folha criado");
      setOpen(false);
      setForm({ ...form, base_amount: "", bonus: "0", deductions: "0", notes: "" });
    }
  };

  const markPaid = async (id: string) => {
    const { error } = await (supabase as any)
      .from("payroll_records")
      .update({ status: "paid", paid_at: new Date().toISOString(), paid_by: user?.id })
      .eq("id", id);
    if (error) toast.error("Erro", { description: error.message });
    else toast.success("Pagamento registrado");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-xl"><div className="text-xs text-muted-foreground">Total pago</div><div className="text-2xl font-bold mt-1">{formatBRL(totals.paid)}</div></Card>
        <Card className="p-5 rounded-xl"><div className="text-xs text-muted-foreground">Pendente</div><div className="text-2xl font-bold mt-1 text-amber-500">{formatBRL(totals.pending)}</div></Card>
        <Card className="p-5 rounded-xl"><div className="text-xs text-muted-foreground">Registros</div><div className="text-2xl font-bold mt-1">{filtered.length}</div></Card>
      </div>

      <Card className="p-4 rounded-xl">
        <div className="flex flex-wrap items-end gap-3">
          {isManager && (
            <div className="min-w-[180px]">
              <Label className="text-xs">Funcionário</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Mês de referência</Label>
            <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
          </div>
          {isManager && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="ml-auto"><Plus className="size-4 mr-1" /> Novo pagamento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar pagamento</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Funcionário</Label>
                    <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Mês de referência</Label><Input type="month" value={form.reference_month} onChange={(e) => setForm({ ...form, reference_month: e.target.value })} /></div>
                    <div><Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Salário base</Label><Input type="number" step="0.01" value={form.base_amount} onChange={(e) => setForm({ ...form, base_amount: e.target.value })} /></div>
                    <div><Label>Bônus</Label><Input type="number" step="0.01" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} /></div>
                    <div><Label>Descontos</Label><Input type="number" step="0.01" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label>Forma de pagamento</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
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
          )}
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Bônus</TableHead>
                <TableHead>Descontos</TableHead>
                <TableHead>Líquido</TableHead>
                <TableHead>Status</TableHead>
                {isManager && <TableHead className="text-right">Ação</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={isManager ? 8 : 7} className="text-center text-muted-foreground py-8">Nenhum registro.</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{profileById.get(r.employee_id) ?? "—"}</TableCell>
                  <TableCell>{r.reference_month.slice(0, 7)}</TableCell>
                  <TableCell>{formatBRL(Number(r.base_amount))}</TableCell>
                  <TableCell>{formatBRL(Number(r.bonus))}</TableCell>
                  <TableCell>{formatBRL(Number(r.deductions))}</TableCell>
                  <TableCell className="font-semibold">{formatBRL(Number(r.net_amount))}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs ${r.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>
                      {r.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                  </TableCell>
                  {isManager && (
                    <TableCell className="text-right">
                      {r.status !== "paid" && <Button size="sm" variant="outline" onClick={() => markPaid(r.id)}>Marcar pago</Button>}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
