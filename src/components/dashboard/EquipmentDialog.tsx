import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Equipment, EquipmentType } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  equipment?: Equipment | null;
}

const DEFAULT_RATE: Record<EquipmentType, number> = { computer: 5, console: 3 };

export function EquipmentDialog({ open, onOpenChange, equipment }: Props) {
  const editing = !!equipment;
  const [name, setName] = useState("");
  const [type, setType] = useState<EquipmentType>("computer");
  const [rate, setRate] = useState<string>("5.00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (equipment) {
      setName(equipment.name);
      setType(equipment.type as EquipmentType);
      setRate(String(equipment.hourly_rate));
      setNotes(equipment.specs ?? "");
    } else {
      setName("");
      setType("computer");
      setRate(DEFAULT_RATE.computer.toFixed(2));
      setNotes("");
    }
  }, [open, equipment]);

  const handleTypeChange = (t: EquipmentType) => {
    setType(t);
    if (!editing) setRate(DEFAULT_RATE[t].toFixed(2));
  };

  const save = async () => {
    const trimmed = name.trim();
    const value = Number(rate.replace(",", "."));
    if (!trimmed) { toast.error("Informe o nome"); return; }
    if (!Number.isFinite(value) || value <= 0) { toast.error("Valor por hora inválido"); return; }
    setSaving(true);
    const payload = { name: trimmed, type, hourly_rate: value, specs: notes.trim() || null };
    const { error } = editing
      ? await supabase.from("equipments").update(payload).eq("id", equipment!.id)
      : await supabase.from("equipments").insert({ ...payload, status: "free", active: true });
    setSaving(false);
    if (error) { toast.error("Erro", { description: error.message }); return; }
    toast.success(editing ? "Equipamento atualizado" : "Equipamento adicionado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (saving) return; onOpenChange(o); }}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar equipamento" : "Adicionar equipamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Tabs value={type} onValueChange={(v) => handleTypeChange(v as EquipmentType)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="computer">Computador</TabsTrigger>
                <TabsTrigger value="console">Videogame</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: PC 01" maxLength={60} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor por hora (R$)</Label>
            <Input type="number" min={0} step="0.50" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Especificações, acessórios, observações…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            {editing ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
