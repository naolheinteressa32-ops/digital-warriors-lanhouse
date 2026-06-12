import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEquipments } from "@/hooks/useEquipments";
import { useActiveSessions } from "@/hooks/useSessions";
import { useWaitingList } from "@/hooks/useWaitingList";
import { Activity, Monitor, Gamepad2, Users, Clock, Gauge } from "lucide-react";

export function MovimentoTab() {
  const { equipments } = useEquipments();
  const { sessions } = useActiveSessions();
  const { waiting } = useWaitingList();

  const stats = useMemo(() => {
    const pcs = equipments.filter((e) => e.type === "computer");
    const cons = equipments.filter((e) => e.type === "console");
    const pcsInUse = pcs.filter((e) => e.status === "in_use").length;
    const consInUse = cons.filter((e) => e.status === "in_use").length;
    const total = equipments.length;
    const inUse = equipments.filter((e) => e.status === "in_use").length;
    const free = equipments.filter((e) => e.status === "free").length;
    const maint = equipments.filter((e) => e.status === "maintenance").length;
    const customersPresent = new Set(
      sessions.filter((s) => s.customer_id).map((s) => s.customer_id),
    ).size + sessions.filter((s) => !s.customer_id).length;
    const occupancy = total ? (inUse / total) * 100 : 0;
    return {
      pcsInUse, pcsTotal: pcs.length,
      consInUse, consTotal: cons.length,
      total, inUse, free, maint,
      customersPresent,
      occupancy,
      waiting: waiting.length,
      activeSessions: sessions.length,
    };
  }, [equipments, sessions, waiting]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Movimentação da loja</h2>
        <p className="text-sm text-muted-foreground">Indicadores em tempo real</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Stat icon={Users} label="Clientes presentes" value={String(stats.customersPresent)} />
        <Stat icon={Activity} label="Sessões ativas" value={String(stats.activeSessions)} />
        <Stat icon={Monitor} label="PCs em uso" value={`${stats.pcsInUse}/${stats.pcsTotal}`} />
        <Stat icon={Gamepad2} label="Videogames em uso" value={`${stats.consInUse}/${stats.consTotal}`} />
        <Stat icon={Clock} label="Fila de espera" value={String(stats.waiting)} />
      </div>

      <Card className="p-5 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2"><Gauge className="size-4" /> Taxa de ocupação</div>
          <div className="text-2xl font-bold">{stats.occupancy.toFixed(1)}%</div>
        </div>
        <Progress value={stats.occupancy} className="h-3" />
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          <div className="p-2 rounded-md bg-muted/30">
            <div className="text-muted-foreground">Em uso</div>
            <div className="font-semibold text-base">{stats.inUse}</div>
          </div>
          <div className="p-2 rounded-md bg-muted/30">
            <div className="text-muted-foreground">Livres</div>
            <div className="font-semibold text-base">{stats.free}</div>
          </div>
          <div className="p-2 rounded-md bg-muted/30">
            <div className="text-muted-foreground">Manutenção</div>
            <div className="font-semibold text-base">{stats.maint}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 rounded-xl">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Monitor className="size-4" /> Computadores</div>
          <OccupancyBar inUse={stats.pcsInUse} total={stats.pcsTotal} />
        </Card>
        <Card className="p-5 rounded-xl">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Gamepad2 className="size-4" /> Videogames</div>
          <OccupancyBar inUse={stats.consInUse} total={stats.consTotal} />
        </Card>
      </div>
    </div>
  );
}

function OccupancyBar({ inUse, total }: { inUse: number; total: number }) {
  const pct = total ? (inUse / total) * 100 : 0;
  return (
    <>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-2xl font-bold">{inUse}<span className="text-base text-muted-foreground"> / {total}</span></div>
        <div className="text-sm text-muted-foreground">{pct.toFixed(0)}%</div>
      </div>
      <Progress value={pct} className="h-2" />
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-5 rounded-xl">
      <div className="text-sm text-muted-foreground flex items-center gap-2"><Icon className="size-4" /> {label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </Card>
  );
}
