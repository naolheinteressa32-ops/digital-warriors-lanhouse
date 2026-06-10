import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Equipment, Customer } from "@/types";
import { DURATION_OPTIONS } from "@/types";
import { formatBRL, formatCPF, onlyDigits } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, UserRound } from "lucide-react";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { usePromotions } from "@/hooks/usePromotions";
import { computePromotion } from "@/lib/promotions";

interface Props {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

type Mode = "registered" | "walkin";

export function StartSessionDialog({ equipment, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { promotions } = usePromotions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mode, setMode] = useState<Mode>("walkin");
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [walkinName, setWalkinName] = useState("");
  const [minutes, setMinutes] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  const loadCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("name");
    if (data) setCustomers(data);
  };

  useEffect(() => {
    if (!open) return;
    setMode("walkin");
    setSearch("");
    setCustomerId("");
    setWalkinName("");
    setMinutes(60);
    loadCustomers();
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = onlyDigits(search);
    if (!q) return customers.slice(0, 50);
    return customers.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (qDigits && c.cpf && onlyDigits(c.cpf).includes(qDigits)) return true;
      return false;
    }).slice(0, 50);
  }, [customers, search]);

  if (!equipment) return null;

  const value = (Number(equipment.hourly_rate) * minutes) / 60;
  const applied = computePromotion(value, promotions);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleStart = async () => {
    if (!user) return;
    if (mode === "walkin" && !walkinName.trim()) {
      toast.error("Informe o nome do cliente avulso");
      return;
    }
    if (mode === "registered" && !selectedCustomer) {
      toast.error("Selecione um cliente cadastrado");
      return;
    }
    setSubmitting(true);
    const now = new Date();
    const endsAt = new Date(now.getTime() + minutes * 60_000);

    const { error: sessErr } = await supabase.from("sessions").insert({
      equipment_id: equipment.id,
      equipment_name: equipment.name,
      equipment_type: equipment.type,
      customer_id: mode === "registered" ? selectedCustomer!.id : null,
      customer_name: mode === "registered" ? selectedCustomer!.name : walkinName.trim(),
      attendant_id: user.id,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_minutes: minutes,
      hourly_rate: equipment.hourly_rate,
      value,
      discount: applied.discount,
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Iniciar sessão — {equipment.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="walkin">Cliente avulso</TabsTrigger>
                <TabsTrigger value="registered">Cliente cadastrado</TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "walkin" ? (
              <div className="space-y-2">
                <Label>Nome do cliente avulso</Label>
                <Input value={walkinName} onChange={(e) => setWalkinName(e.target.value)} placeholder="Ex.: Cliente balcão" maxLength={80} />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Buscar cliente</Label>
                  <Button type="button" size="sm" variant="ghost" className="h-7" onClick={() => setNewCustomerOpen(true)}>
                    <UserPlus className="size-3.5 mr-1" /> Novo
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Nome ou CPF" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="max-h-44 overflow-auto rounded-lg border border-border divide-y divide-border">
                  {filtered.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">Nenhum cliente encontrado.</div>
                  ) : filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCustomerId(c.id)}
                      className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-accent transition-colors ${customerId === c.id ? "bg-accent" : ""}`}
                    >
                      <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <UserRound className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.cpf ? formatCPF(c.cpf) : "Sem CPF"}</div>
                      </div>
                    </button>
                  ))}
                </div>
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

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Valor</div>
                <div className={`text-base ${applied.discount > 0 ? "line-through text-muted-foreground" : "text-2xl font-bold text-primary"}`}>{formatBRL(value)}</div>
              </div>
              {applied.promotion && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-muted-foreground">Desconto ({applied.percent.toFixed(0)}%) — {applied.promotion.name}</div>
                    <div className="text-destructive font-medium">- {formatBRL(applied.discount)}</div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div className="text-sm font-medium">Total</div>
                    <div className="text-2xl font-bold text-primary">{formatBRL(applied.finalValue)}</div>
                  </div>
                </>
              )}
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

      <CustomerDialog
        customer={null}
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
        onSaved={(c) => {
          loadCustomers();
          setCustomerId(c.id);
          setSearch(c.name);
        }}
      />
    </>
  );
}
