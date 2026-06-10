import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Customer } from "@/types";
import { isValidCPF, maskCPFInput, maskPhoneInput, onlyDigits } from "@/lib/format";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: (customer: Customer) => void;
}

export function CustomerDialog({ customer, open, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(customer?.name ?? "");
    setCpf(customer?.cpf ? maskCPFInput(customer.cpf) : "");
    setPhone(customer?.phone ? maskPhoneInput(customer.phone) : "");
    setEmail(customer?.email ?? "");
  }, [open, customer]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Informe um nome válido");
      return;
    }
    const cpfDigits = onlyDigits(cpf);
    if (cpfDigits && !isValidCPF(cpfDigits)) {
      toast.error("CPF inválido");
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("E-mail inválido");
      return;
    }

    setSaving(true);
    const payload = {
      name: trimmedName,
      cpf: cpfDigits || null,
      phone: onlyDigits(phone) || null,
      email: email.trim() || null,
    };

    const query = customer
      ? supabase.from("customers").update(payload).eq("id", customer.id).select().single()
      : supabase.from("customers").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error) {
      if (error.code === "23505") toast.error("CPF já cadastrado");
      else toast.error("Erro ao salvar cliente", { description: error.message });
      return;
    }
    toast.success(customer ? "Cliente atualizado" : "Cliente cadastrado");
    if (data) onSaved?.(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>{customer ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(maskCPFInput(e.target.value))} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(maskPhoneInput(e.target.value))} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" maxLength={255} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
