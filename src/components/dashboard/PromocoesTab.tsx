import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePromotions, type Promotion } from "@/hooks/usePromotions";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Percent } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";

export function PromocoesTab() {
  const { promotions, loading } = usePromotions();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({ name: "", description: "", percent_off: "10", active: true, valid_from: "", valid_until: "" });
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", percent_off: "10", active: true, valid_from: "", valid_until: "" }); setOpen(true); };
  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description ?? "", percent_off: String(p.percent_off), active: p.active,
      valid_from: p.valid_from ? p.valid_from.slice(0, 16) : "",
      valid_until: p.valid_until ? p.valid_until.slice(0, 16) : "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Informe o nome"); return; }
    const pct = Number(form.percent_off);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) { toast.error("Desconto inválido"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      percent_off: pct,
      active: form.active,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    };
    const q = editing
      ? supabase.from("promotions" as never).update(payload).eq("id", editing.id)
      : supabase.from("promotions" as never).insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { toast.error("Erro", { description: error.message }); return; }
    toast.success(editing ? "Promoção atualizada" : "Promoção criada");
    setOpen(false);
  };

  const remove = async (p: Promotion) => {
    const { error } = await supabase.from("promotions" as never).delete().eq("id", p.id);
    if (error) toast.error("Erro", { description: error.message });
    else toast.success("Removida");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button className="rounded-lg" onClick={openNew}><Plus className="size-4 mr-2" /> Nova promoção</Button></div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : promotions.length === 0 ? (
        <Card className="p-12 rounded-xl text-center text-muted-foreground">Nenhuma promoção cadastrada.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((p) => (
            <Card key={p.id} className={`p-5 rounded-xl space-y-3 ${p.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center"><Percent className="size-5" /></div>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.active ? "Ativa" : "Inativa"}</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">{Number(p.percent_off).toFixed(0)}%</div>
              </div>
              {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Início: {p.valid_from ? formatDateTime(p.valid_from) : "—"}</div>
                <div>Fim: {p.valid_until ? formatDateTime(p.valid_until) : "—"}</div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => openEdit(p)}><Pencil className="size-4 mr-2" /> Editar</Button>
                <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => remove(p)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader><DialogTitle>{editing ? "Editar promoção" : "Nova promoção"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Desconto (%)</Label><Input type="number" min={0} max={100} value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Início</Label><Input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Ativa</Label></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="size-4 mr-2 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
