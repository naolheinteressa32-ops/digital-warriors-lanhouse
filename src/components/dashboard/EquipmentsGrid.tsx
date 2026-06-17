import { useMemo, useState } from "react";
import { useEquipments } from "@/hooks/useEquipments";
import { useActiveSessions } from "@/hooks/useSessions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SessionTimer } from "@/components/sessions/SessionTimer";
import { StartSessionDialog } from "@/components/sessions/StartSessionDialog";
import { EquipmentDialog } from "@/components/dashboard/EquipmentDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Equipment, EquipmentStatus, EquipmentType } from "@/types";
import { Monitor, Gamepad2, Search, Play, Square, Loader2, Wrench, Plus, Pencil, Power, PowerOff } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FilterType = "all" | EquipmentType;
type FilterStatus = "all" | EquipmentStatus;

interface Props {
  /** Manager mode: shows maintenance toggle, add/edit/disable actions, and inactive equipment. */
  allowMaintenance?: boolean;
}

export function EquipmentsGrid({ allowMaintenance = false }: Props) {
  const { equipments, loading } = useEquipments({ includeInactive: allowMaintenance });
  const { sessions } = useActiveSessions();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [startTarget, setStartTarget] = useState<Equipment | null>(null);
  const [endTarget, setEndTarget] = useState<Equipment | null>(null);
  const [ending, setEnding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [disableTarget, setDisableTarget] = useState<Equipment | null>(null);

  const sessionByEquipId = useMemo(() => {
    const m = new Map<string, typeof sessions[number]>();
    for (const s of sessions) m.set(s.equipment_id, s);
    return m;
  }, [sessions]);

  const filtered = useMemo(() => {
    return equipments.filter((e) => {
      if (filterType !== "all" && e.type !== filterType) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [equipments, filterType, filterStatus, search]);

  const handleEndSession = async () => {
    if (!endTarget) return;
    const session = sessionByEquipId.get(endTarget.id);
    if (!session) { toast.error("Sessão não encontrada"); setEndTarget(null); return; }
    setEnding(true);
    const { error: sErr } = await supabase
      .from("sessions")
      .update({ status: "finished", ended_at: new Date().toISOString() })
      .eq("id", session.id);
    if (sErr) { setEnding(false); toast.error("Erro ao encerrar", { description: sErr.message }); return; }
    await supabase.from("equipments").update({ status: "free" }).eq("id", endTarget.id);
    setEnding(false);
    toast.success(`Sessão encerrada — ${formatBRL(Number(session.value))} cobrado`);
    setEndTarget(null);
  };

  const toggleMaintenance = async (e: Equipment) => {
    if (e.status === "in_use") { toast.error("Equipamento em uso"); return; }
    const next = e.status === "maintenance" ? "free" : "maintenance";
    const { error } = await supabase.from("equipments")
      .update({ status: next, last_maintenance: next === "maintenance" ? new Date().toISOString() : e.last_maintenance })
      .eq("id", e.id);
    if (error) toast.error("Erro", { description: error.message });
    else toast.success(next === "maintenance" ? "Marcado em manutenção" : "Liberado");
  };

  const toggleActive = async (e: Equipment) => {
    if (e.active && e.status === "in_use") { toast.error("Equipamento em uso"); return; }
    const { error } = await supabase.from("equipments").update({ active: !e.active }).eq("id", e.id);
    if (error) toast.error("Erro", { description: error.message });
    else toast.success(e.active ? "Equipamento desativado" : "Equipamento reativado");
    setDisableTarget(null);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 rounded-xl">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar equipamento..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="computer">Computadores</TabsTrigger>
                <TabsTrigger value="console">Videogames</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <TabsList>
                <TabsTrigger value="all">Status</TabsTrigger>
                <TabsTrigger value="free">Livres</TabsTrigger>
                <TabsTrigger value="in_use">Em Uso</TabsTrigger>
                <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
              </TabsList>
            </Tabs>
            {allowMaintenance && (
              <Button size="sm" className="rounded-lg" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="size-4 mr-2" /> Adicionar Equipamento
              </Button>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 rounded-xl text-center text-muted-foreground">Nenhum equipamento encontrado.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((e) => {
            const session = sessionByEquipId.get(e.id);
            const expired = session ? new Date(session.ends_at).getTime() <= Date.now() : false;
            const inactive = !e.active;
            return (
              <Card key={e.id} className={`p-5 rounded-xl space-y-3 ${expired ? "ring-2 ring-destructive" : ""} ${inactive ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {e.type === "computer" ? <Monitor className="size-5 text-primary" /> : <Gamepad2 className="size-5 text-primary" />}
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{e.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{e.specs}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={e.status as EquipmentStatus} />
                    {inactive && <Badge variant="outline" className="text-[10px]">Desativado</Badge>}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{formatBRL(Number(e.hourly_rate))} / hora</div>
                {session && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Cliente: <span className="text-foreground font-medium">{session.customer_name ?? "Avulso"}</span>
                    </div>
                    <SessionTimer session={session} />
                    <div className="text-xs text-muted-foreground">Valor: {formatBRL(Number(session.value))}</div>
                  </div>
                )}
                <div className="pt-1 space-y-2">
                  {!inactive && e.status === "free" && (
                    <Button size="sm" className="w-full rounded-lg" onClick={() => setStartTarget(e)}>
                      <Play className="size-4 mr-2" /> Iniciar Sessão
                    </Button>
                  )}
                  {e.status === "in_use" && (
                    <Button size="sm" variant="destructive" className="w-full rounded-lg" onClick={() => setEndTarget(e)}>
                      <Square className="size-4 mr-2" /> Encerrar Sessão
                    </Button>
                  )}
                  {!inactive && e.status === "maintenance" && (
                    <Button size="sm" variant="outline" className="w-full rounded-lg" disabled>Em manutenção</Button>
                  )}
                  {allowMaintenance && (
                    <div className="flex flex-wrap gap-2">
                      {!inactive && e.status !== "in_use" && (
                        <Button size="sm" variant="ghost" className="flex-1 rounded-lg" onClick={() => toggleMaintenance(e)}>
                          <Wrench className="size-4 mr-1" />
                          {e.status === "maintenance" ? "Liberar" : "Manutenção"}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="flex-1 rounded-lg" onClick={() => { setEditing(e); setDialogOpen(true); }}>
                        <Pencil className="size-4 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 rounded-lg" onClick={() => setDisableTarget(e)}>
                        {inactive ? <><Power className="size-4 mr-1" /> Reativar</> : <><PowerOff className="size-4 mr-1 text-destructive" /> Desativar</>}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <StartSessionDialog equipment={startTarget} open={!!startTarget} onOpenChange={(o) => !o && setStartTarget(null)} />
      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} equipment={editing} />

      <AlertDialog open={!!endTarget} onOpenChange={(o) => !o && setEndTarget(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              {endTarget && (() => {
                const s = sessionByEquipId.get(endTarget.id);
                return s ? `Cliente ${s.customer_name ?? "avulso"} no ${endTarget.name}. Valor: ${formatBRL(Number(s.value))}.` : null;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession} disabled={ending}>
              {ending && <Loader2 className="size-4 mr-2 animate-spin" />}Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!disableTarget} onOpenChange={(o) => !o && setDisableTarget(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {disableTarget?.active ? "Desativar equipamento?" : "Reativar equipamento?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disableTarget?.active
                ? "O equipamento ficará oculto para novas sessões mas o histórico será preservado."
                : "O equipamento voltará a aparecer como disponível para sessões."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => disableTarget && toggleActive(disableTarget)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
