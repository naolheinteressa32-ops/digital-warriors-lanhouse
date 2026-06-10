import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useEquipments } from "@/hooks/useEquipments";
import { useActiveSessions } from "@/hooks/useSessions";
import { useWaitingList } from "@/hooks/useWaitingList";
import { useCustomers } from "@/hooks/useCustomers";
import { Monitor, Gamepad2, Users, Clock, Activity, AlertCircle } from "lucide-react";
import { formatBRL } from "@/lib/format";

export function OverviewAttendant() {
  const { equipments } = useEquipments();
  const { sessions } = useActiveSessions();
  const { waiting } = useWaitingList();
  const { customers } = useCustomers();

  const stats = useMemo(() => {
    const pcs = equipments.filter((e) => e.type === "computer");
    const cons = equipments.filter((e) => e.type === "console");
    const inUse = equipments.filter((e) => e.status === "in_use").length;
    const free = equipments.filter((e) => e.status === "free").length;
    const maint = equipments.filter((e) => e.status === "maintenance").length;
    const expired = sessions.filter((s) => new Date(s.ends_at).getTime() <= Date.now()).length;
    const activeRevenue = sessions.reduce((sum, s) => sum + Number(s.value), 0);
    return {
      pcsInUse: pcs.filter((e) => e.status === "in_use").length,
      pcsTotal: pcs.length,
      consInUse: cons.filter((e) => e.status === "in_use").length,
      consTotal: cons.length,
      inUse, free, maint, expired, activeRevenue,
    };
  }, [equipments, sessions]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Activity} label="Sessões ativas" value={String(sessions.length)} />
        <Stat icon={Monitor} label="PCs em uso" value={`${stats.pcsInUse}/${stats.pcsTotal}`} />
        <Stat icon={Gamepad2} label="Consoles em uso" value={`${stats.consInUse}/${stats.consTotal}`} />
        <Stat icon={Clock} label="Em espera" value={String(waiting.length)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={AlertCircle} label="Sessões expiradas" value={String(stats.expired)} highlight={stats.expired > 0} />
        <Stat icon={Users} label="Clientes cadastrados" value={String(customers.length)} />
        <Stat icon={Activity} label="Livres" value={String(stats.free)} />
        <Stat icon={Activity} label="Receita ativa" value={formatBRL(stats.activeRevenue)} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={`p-5 rounded-xl ${highlight ? "ring-2 ring-destructive" : ""}`}>
      <div className="text-sm text-muted-foreground flex items-center gap-2"><Icon className="size-4" /> {label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </Card>
  );
}
