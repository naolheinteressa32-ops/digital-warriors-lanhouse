import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCashRegisters } from "@/hooks/useCashRegisters";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateTime } from "@/lib/format";
import { Wallet, Lock, Unlock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { CashRegister } from "@/types";

export function CaixaTab() {
  const { user, role } = useAuth();
  const isManager = role === "manager";
  const { registers, loading } = useCashRegisters();
  const { profiles } = useProfiles();

  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [profiles]);

  const myOpen = useMemo(
    () => registers.find((r) => r.attendant_id === user?.id && r.status === "open") ?? null,
    [registers, user?.id],
  );

  // Expected cash for the currently-open caixa = opening + sum of cash sessions finished since opening
  const [expectedCash, setExpectedCash] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    if (!myOpen) { setExpectedCash(null); return; }
    (async () => {
      const { data: rows } = await supabase
        .from("sessions")
        .select("value, discount, payment_method, attendant_id, ended_at, status")
        .eq("attendant_id", myOpen.attendant_id)
        .eq("status", "finished")
        .eq("payment_method", "cash")
        .gte("ended_at", myOpen.opened_at);
      if (!active) return;
      const cashTotal = (rows ?? []).reduce(
        (s, r) => s + Number(r.value ?? 0) - Number(r.discount ?? 0),
        0,
      );
      setExpectedCash(Number(myOpen.opening_amount) + cashTotal);
    })();
    return () => { active = false; };
  }, [myOpen]);

  const auditStats = useMemo(() => {
    const closed = registers.filter((r) => r.status === "closed");
    const positives = closed.filter((r) => Number(r.difference ?? 0) > 0).length;
    const negatives = closed.filter((r) => Number(r.difference ?? 0) < 0).length;
    const totalDiff = closed.reduce((s, r) => s + Number(r.difference ?? 0), 0);
    return { closedCount: closed.length, positives, negatives, totalDiff };
  }, [registers]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {!myOpen ? (
        <OpenCaixaCard userId={user!.id} />
      ) : (
        <CloseCaixaCard reg={myOpen} expected={expectedCash} userId={user!.id} />
      )}

      {isManager && (
        <Card className="p-5 rounded-xl">
          <div className="text-sm font-semibold mb-3">Auditoria</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Mini label="Fechamentos" value={String(auditStats.closedCount)} />
            <Mini label="Sobras (+)" value={String(auditStats.positives)} />
            <Mini label="Faltas (−)" value={String(auditStats.negatives)} />
            <Mini label="Diferença total" value={formatBRL(auditStats.totalDiff)} />
          </div>
        </Card>
      )}

      <Card className="p-5 rounded-xl">
        <div className="text-sm font-semibold mb-3">
          {isManager ? "Histórico de caixas (todos)" : "Meus caixas"}
        </div>
        {registers.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum caixa registrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase">
                <tr>
                  {isManager && <th className="text-left p-2">Responsável</th>}
                  <th className="text-left p-2">Abertura</th>
                  <th className="text-left p-2">Fechamento</th>
                  <th className="text-right p-2">Inicial</th>
                  <th className="text-right p-2">Esperado</th>
                  <th className="text-right p-2">Contado</th>
                  <th className="text-right p-2">Diferença</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {registers.map((r) => {
                  const diff = Number(r.difference ?? 0);
                  const diffClass = r.status === "open" ? "text-muted-foreground" : diff === 0 ? "text-emerald-500" : diff > 0 ? "text-primary" : "text-destructive";
                  return (
                    <tr key={r.id} className="border-t border-border">
                      {isManager && <td className="p-2">{profileMap.get(r.attendant_id) ?? "—"}</td>}
                      <td className="p-2">{formatDateTime(r.opened_at)}</td>
                      <td className="p-2">{formatDateTime(r.closed_at)}</td>
                      <td className="p-2 text-right">{formatBRL(Number(r.opening_amount))}</td>
                      <td className="p-2 text-right">{r.expected_amount != null ? formatBRL(Number(r.expected_amount)) : "—"}</td>
                      <td className="p-2 text-right">{r.counted_amount != null ? formatBRL(Number(r.counted_amount)) : "—"}</td>
                      <td className={`p-2 text-right font-medium ${diffClass}`}>
                        {r.status === "open" ? "—" : formatBRL(diff)}
                      </td>
                      <td className="p-2">
                        <Badge variant={r.status === "open" ? "default" : "secondary"} className="uppercase text-[10px]">
                          {r.status === "open" ? "Aberto" : "Fechado"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function OpenCaixaCard({ userId }: { userId: string }) {
  const [opening, setOpening] = useState("0,00");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = Number(opening.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(value) || value < 0) { toast.error("Valor inicial inválido"); return; }
    setBusy(true);
    const { error } = await supabase.from("cash_registers").insert({
      attendant_id: userId,
      opening_amount: value,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) toast.error("Erro", { description: error.message });
    else { toast.success("Caixa aberto"); setOpening("0,00"); setNotes(""); }
  };

  return (
    <Card className="p-5 rounded-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          <Unlock className="size-5" />
        </div>
        <div>
          <div className="font-semibold">Abrir caixa</div>
          <div className="text-xs text-muted-foreground">Você não possui caixa aberto no momento.</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Valor inicial (R$)</Label>
          <Input inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0,00" />
        </div>
        <div className="space-y-1 md:col-span-1">
          <Label>Observações</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
        </div>
      </div>
      <Button onClick={submit} disabled={busy} className="rounded-lg">
        {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : <Wallet className="size-4 mr-2" />}
        Abrir caixa
      </Button>
    </Card>
  );
}

function CloseCaixaCard({ reg, expected, userId }: { reg: CashRegister; expected: number | null; userId: string }) {
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState(reg.notes ?? "");
  const [busy, setBusy] = useState(false);

  const countedNum = Number(counted.replace(/\./g, "").replace(",", "."));
  const exp = expected ?? Number(reg.opening_amount);
  const diff = Number.isFinite(countedNum) ? countedNum - exp : 0;

  const close = async () => {
    if (!Number.isFinite(countedNum) || countedNum < 0) { toast.error("Valor contado inválido"); return; }
    setBusy(true);
    const { error } = await supabase.from("cash_registers").update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: userId,
      expected_amount: exp,
      counted_amount: countedNum,
      difference: diff,
      notes: notes.trim() || null,
    }).eq("id", reg.id);
    setBusy(false);
    if (error) toast.error("Erro", { description: error.message });
    else toast.success("Caixa fechado");
  };

  const diffOk = Math.abs(diff) < 0.005;

  return (
    <Card className="p-5 rounded-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
          <Lock className="size-5" />
        </div>
        <div>
          <div className="font-semibold">Caixa aberto</div>
          <div className="text-xs text-muted-foreground">Aberto em {formatDateTime(reg.opened_at)}</div>
        </div>
        <Badge className="ml-auto" variant="default">Em uso</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Inicial" value={formatBRL(Number(reg.opening_amount))} />
        <Mini label="Vendas em dinheiro" value={expected != null ? formatBRL(exp - Number(reg.opening_amount)) : "…"} />
        <Mini label="Esperado em caixa" value={expected != null ? formatBRL(exp) : "…"} />
        <Mini
          label="Diferença"
          value={Number.isFinite(countedNum) ? formatBRL(diff) : "—"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Valor contado (R$)</Label>
          <Input inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} placeholder="0,00" />
        </div>
        <div className="space-y-1">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} placeholder="Opcional" />
        </div>
      </div>

      {Number.isFinite(countedNum) && (
        <div className={`flex items-center gap-2 text-sm ${diffOk ? "text-emerald-500" : "text-destructive"}`}>
          {diffOk ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
          {diffOk ? "Conferência exata." : diff > 0 ? `Sobra de ${formatBRL(diff)}` : `Falta de ${formatBRL(Math.abs(diff))}`}
        </div>
      )}

      <Button onClick={close} disabled={busy || !counted} variant="destructive" className="rounded-lg">
        {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : <Lock className="size-4 mr-2" />}
        Fechar caixa
      </Button>
    </Card>
  );
}
