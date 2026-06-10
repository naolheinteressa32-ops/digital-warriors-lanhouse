import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useWaitingList } from "@/hooks/useWaitingList";
import { useCustomers } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

export function WaitingListTab() {
  const { waiting, loading } = useWaitingList();
  const { customers } = useCustomers();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const finalName = customerId ? customers.find((c) => c.id === customerId)?.name ?? "" : name.trim();
    if (!finalName) { toast.error("Informe o nome"); return; }
    setSaving(true);
    const nextPos = (waiting[waiting.length - 1]?.position ?? 0) + 1;
    const { error } = await supabase.from("waiting_list").insert({
      customer_id: customerId || null,
      customer_name: finalName,
      position: nextPos,
    });
    setSaving(false);
    if (error) { toast.error("Erro", { description: error.message }); return; }
    toast.success("Adicionado à fila");
    setOpen(false); setName(""); setCustomerId("");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("waiting_list").delete().eq("id", id);
    if (error) toast.error("Erro", { description: error.message });
    else toast.success("Removido da fila");
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = waiting[idx]; const b = waiting[idx + dir];
    if (!a || !b) return;
    await supabase.from("waiting_list").update({ position: b.position }).eq("id", a.id);
    await supabase.from("waiting_list").update({ position: a.position }).eq("id", b.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="size-4" /> {waiting.length} pessoa(s) aguardando</div>
        <Button className="rounded-lg" onClick={() => setOpen(true)}><Plus className="size-4 mr-2" /> Adicionar</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : waiting.length === 0 ? (
        <Card className="p-12 rounded-xl text-center text-muted-foreground">Fila vazia.</Card>
      ) : (
        <div className="space-y-2">
          {waiting.map((w, idx) => (
            <Card key={w.id} className="p-4 rounded-xl flex items-center gap-3">
              <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">{idx + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{w.customer_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Entrou: {formatDateTime(w.entered_at)}</div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(idx, -1)}><ArrowUp className="size-4" /></Button>
                <Button size="icon" variant="ghost" disabled={idx === waiting.length - 1} onClick={() => move(idx, 1)}><ArrowDown className="size-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(w.id)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader><DialogTitle>Adicionar à fila</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente cadastrado (opcional)</Label>
              <select className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">— Avulso —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {!customerId && (
              <div>
                <Label>Nome (avulso)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cliente" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={add} disabled={saving}>{saving && <Loader2 className="size-4 mr-2 animate-spin" />}Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
