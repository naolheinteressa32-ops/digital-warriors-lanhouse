import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Equipment, Customer, PaymentMethod } from "@/types";
import { formatBRL, formatCPF, onlyDigits } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, UserRound, ArrowLeft, ArrowRight, Printer, Check, Banknote, QrCode, CreditCard } from "lucide-react";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { usePromotions } from "@/hooks/usePromotions";
import { computePromotion } from "@/lib/promotions";
import { SessionReceipt, type ReceiptData } from "./SessionReceipt";

interface Props {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

type Step = "customer" | "time" | "summary" | "payment" | "receipt";
type Mode = "walkin" | "registered";

const TIME_PRESETS = [15, 30, 45, 60, 90, 120, 180];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "pix", label: "PIX", icon: QrCode },
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "debit", label: "Débito", icon: CreditCard },
  { value: "credit", label: "Crédito", icon: CreditCard },
];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function StartSessionDialog({ equipment, open, onOpenChange }: Props) {
  const { user, profile } = useAuth();
  const { promotions } = usePromotions();

  const [step, setStep] = useState<Step>("customer");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mode, setMode] = useState<Mode>("walkin");
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [walkinName, setWalkinName] = useState("");
  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cashReceivedStr, setCashReceivedStr] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const loadCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("name");
    if (data) setCustomers(data);
  };

  useEffect(() => {
    if (!open) return;
    setStep("customer");
    setMode("walkin");
    setSearch("");
    setCustomerId("");
    setWalkinName("");
    setHours(1);
    setMinutes(0);
    setPaymentMethod("pix");
    setCashReceivedStr("");
    setReceipt(null);
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

  const totalMinutes = Math.max(0, hours * 60 + minutes);
  const value = Math.round((Number(equipment.hourly_rate) * totalMinutes) / 60 * 100) / 100;
  const applied = computePromotion(value, promotions);
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerName = mode === "registered" ? selectedCustomer?.name ?? "" : walkinName.trim();
  const cashReceived = Number(cashReceivedStr.replace(",", ".")) || 0;
  const change = Math.max(0, cashReceived - applied.finalValue);
  const cashOk = paymentMethod !== "cash" || cashReceived >= applied.finalValue;

  const canContinueCustomer =
    (mode === "walkin" && walkinName.trim().length > 0) ||
    (mode === "registered" && !!selectedCustomer);
  const canContinueTime = totalMinutes >= 5;

  const handleConfirmPayment = async () => {
    if (!user) return;
    if (!cashOk) {
      toast.error("Valor recebido menor que o total");
      return;
    }
    setSubmitting(true);
    const now = new Date();
    const endsAt = new Date(now.getTime() + totalMinutes * 60_000);

    const { error: sessErr } = await supabase.from("sessions").insert({
      equipment_id: equipment.id,
      equipment_name: equipment.name,
      equipment_type: equipment.type,
      customer_id: mode === "registered" ? selectedCustomer!.id : null,
      customer_name: customerName,
      attendant_id: user.id,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_minutes: totalMinutes,
      hourly_rate: equipment.hourly_rate,
      value: applied.finalValue,
      discount: applied.discount,
      payment_method: paymentMethod,
      status: "active",
    });

    if (sessErr) {
      setSubmitting(false);
      toast.error("Erro ao iniciar sessão", { description: sessErr.message });
      return;
    }

    const { error: equipErr } = await supabase
      .from("equipments").update({ status: "in_use" }).eq("id", equipment.id);

    setSubmitting(false);
    if (equipErr) {
      toast.error("Sessão criada, mas falha ao atualizar equipamento");
    }

    setReceipt({
      customerName,
      equipmentName: equipment.name,
      equipmentType: equipment.type as "computer" | "console",
      durationMinutes: totalMinutes,
      value,
      discount: applied.discount,
      finalValue: applied.finalValue,
      paymentMethod,
      cashReceived: paymentMethod === "cash" ? cashReceived : undefined,
      change: paymentMethod === "cash" ? change : undefined,
      attendantName: profile?.name ?? user.email ?? "—",
      startedAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
    });
    setStep("receipt");
    toast.success("Pagamento confirmado — sessão iniciada");
  };

  const stepIndex = ["customer", "time", "summary", "payment", "receipt"].indexOf(step);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (submitting) return; onOpenChange(o); }}>
        <DialogContent className="rounded-xl max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {step === "receipt" ? "Comprovante" : `Iniciar sessão — ${equipment.name}`}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          {step !== "receipt" && (
            <div className="flex items-center gap-1.5 -mt-1 mb-1">
              {["Cliente", "Tempo", "Resumo", "Pagamento"].map((label, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1 w-full rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted"}`} />
                  <div className={`text-[10px] ${i === stepIndex ? "text-primary font-medium" : "text-muted-foreground"}`}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* STEP: Customer */}
          {step === "customer" && (
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
                  <Input value={walkinName} onChange={(e) => setWalkinName(e.target.value)} placeholder="Ex.: Cliente balcão" maxLength={80} autoFocus />
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
                  <div className="max-h-52 overflow-auto rounded-lg border border-border divide-y divide-border">
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
            </div>
          )}

          {/* STEP: Time */}
          {step === "time" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Duração da sessão</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Horas</Label>
                    <Input
                      type="number" min={0} max={12} value={hours}
                      onChange={(e) => setHours(Math.max(0, Math.min(12, Number(e.target.value) || 0)))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Minutos</Label>
                    <Input
                      type="number" min={0} max={59} step={5} value={minutes}
                      onChange={(e) => setMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Sugestões rápidas</Label>
                <div className="flex flex-wrap gap-2">
                  {TIME_PRESETS.map((m) => (
                    <Button key={m} type="button" size="sm" variant="outline"
                      className="rounded-full"
                      onClick={() => { setHours(Math.floor(m / 60)); setMinutes(m % 60); }}
                    >
                      {formatDuration(m)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {formatDuration(totalMinutes)} × {formatBRL(Number(equipment.hourly_rate))}/h
                </div>
                <div className="text-2xl font-bold text-primary">{formatBRL(value)}</div>
              </div>
              {!canContinueTime && (
                <div className="text-xs text-destructive">Duração mínima de 5 minutos.</div>
              )}
            </div>
          )}

          {/* STEP: Summary */}
          {step === "summary" && (
            <div className="space-y-3">
              <SummaryRow label="Equipamento" value={`${equipment.name} (${equipment.type === "computer" ? "Computador" : "Videogame"})`} />
              <SummaryRow label="Cliente" value={customerName} />
              <SummaryRow label="Duração" value={formatDuration(totalMinutes)} />
              <SummaryRow label="Tarifa" value={`${formatBRL(Number(equipment.hourly_rate))}/h`} />
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className={applied.discount > 0 ? "line-through text-muted-foreground" : ""}>{formatBRL(value)}</span>
                </div>
                {applied.promotion && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto ({applied.percent.toFixed(0)}%) — {applied.promotion.name}</span>
                    <span className="text-destructive font-medium">- {formatBRL(applied.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatBRL(applied.finalValue)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Payment */}
          {step === "payment" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Método de pagamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = paymentMethod === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPaymentMethod(opt.value)}
                        className={`rounded-lg border p-3 flex items-center gap-2 transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                      >
                        <Icon className="size-4" />
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total a pagar</span>
                  <span className="text-2xl font-bold text-primary">{formatBRL(applied.finalValue)}</span>
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <Label>Valor recebido</Label>
                  <Input
                    type="number" min={0} step="0.01" inputMode="decimal"
                    value={cashReceivedStr}
                    onChange={(e) => setCashReceivedStr(e.target.value)}
                    placeholder="0,00"
                  />
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-muted-foreground">Troco</span>
                    <span className={`font-semibold ${cashOk ? "text-success" : "text-destructive"}`}>
                      {cashOk ? formatBRL(change) : "Valor insuficiente"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP: Receipt */}
          {step === "receipt" && receipt && (
            <div className="space-y-3">
              <SessionReceipt data={receipt} />
            </div>
          )}

          <DialogFooter className="gap-2">
            {step === "customer" && (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button disabled={!canContinueCustomer} onClick={() => setStep("time")}>
                  Continuar <ArrowRight className="size-4 ml-2" />
                </Button>
              </>
            )}
            {step === "time" && (
              <>
                <Button variant="ghost" onClick={() => setStep("customer")}>
                  <ArrowLeft className="size-4 mr-2" /> Voltar
                </Button>
                <Button disabled={!canContinueTime} onClick={() => setStep("summary")}>
                  Continuar <ArrowRight className="size-4 ml-2" />
                </Button>
              </>
            )}
            {step === "summary" && (
              <>
                <Button variant="ghost" onClick={() => setStep("time")}>
                  <ArrowLeft className="size-4 mr-2" /> Voltar
                </Button>
                <Button onClick={() => setStep("payment")}>
                  Ir para pagamento <ArrowRight className="size-4 ml-2" />
                </Button>
              </>
            )}
            {step === "payment" && (
              <>
                <Button variant="ghost" onClick={() => setStep("summary")} disabled={submitting}>
                  <ArrowLeft className="size-4 mr-2" /> Voltar
                </Button>
                <Button onClick={handleConfirmPayment} disabled={submitting || !cashOk}>
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Confirmar pagamento
                </Button>
              </>
            )}
            {step === "receipt" && (
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="size-4 mr-2" /> Imprimir
                </Button>
                <Button onClick={() => onOpenChange(false)}>
                  <Check className="size-4 mr-2" /> Concluir
                </Button>
              </>
            )}
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
