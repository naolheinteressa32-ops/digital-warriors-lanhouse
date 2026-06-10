import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Equipment, Customer } from "@/types";
import { DURATION_OPTIONS } from "@/types";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function StartSessionDialog({ equipment, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string>("walkin");
  const [walkinName, setWalkinName] = useState("");
  const [minutes, setMinutes] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCustomerId("walkin");
    setWalkinName("");
    setMinutes(60);
    supabase.from("customers").select("*").order("name").then(({ data }) => {
      if (data) setCustomers(data);
    });
  }, [open]);

  if (!equipment) return null;

  const value = (equipment.hourly_rate * minutes) / 60;
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleStart = async () => {
    if (!user) return;
    if (customerId === "walkin" && !walkinName.trim()) {
      toast.error("Informe o nome do cliente avulso");
      return;
    }
    setSubmitting(true);
    const now = new Date();
    const endsAt = new Date(now.getTime() + minutes * 60_000);

    const { error: sessErr } = await supabase.from("sessions").insert({
      equipment_id: equipment.id,
      equipment_name: equipment.name,
      equipment_type: equipment.type,
      customer_id: customerId === "walkin" ? null : customerId,
      customer_name: customerId === "walkin" ? walkinName.trim() : selectedCustomer?.name ?? null,
      attendant_id: user.id,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_minutes: minutes,
      hourly_rate: equipment.hourly_rate,
      value,
      status: "active",
    });

    if (sessErr) {
      toast.error("Erro ao iniciar sessão", { description: sessErr.message });
      setSubmitting(false);
      return;
    }

    const { error: equipErr } = await supabase
      .from("equipments").update({ status: "in_use" }).eq("id", equipment.id);

    setSubmitting(false);
    if (equipErr) {
      toast.error("Sessão criada, mas falha ao atualizar equipamento");
      return;
    }
    toast.success(`Sessão iniciada em ${equipment.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>Iniciar sessão — {equipment.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="walkin">Cliente avulso</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customerId === "walkin" && (
            <div className="space-y-2">
              <Label>Nome do cliente avulso</Label>
              <Input value={walkinName} onChange={(e) => setWalkinName(e.target.value)} placeholder="Ex.: Cliente balcão" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Tempo</Label>
            <Select value={String(minutes)} onValueChange={(v) => setMinutes(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d.minutes} value={String(d.minutes)}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Valor</div>
            <div className="text-2xl font-bold text-primary">{formatBRL(value)}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleStart} disabled={submitting}>
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Iniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
