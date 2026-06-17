import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWaitingList } from "@/hooks/useWaitingList";
import { useEquipments } from "@/hooks/useEquipments";
import { useActiveSessions } from "@/hooks/useSessions";
import { StartSessionDialog } from "@/components/sessions/StartSessionDialog";
import { BellRing, Play, Monitor, Gamepad2 } from "lucide-react";
import type { Equipment } from "@/types";

/**
 * Prominent notification shown whenever a customer is waiting AND at least one
 * equipment is free. Suggests the next assignment — does NOT auto-start.
 */
export function WaitingQueueAlert() {
  const { waiting } = useWaitingList();
  const { equipments } = useEquipments();
  const { sessions } = useActiveSessions();
  const [target, setTarget] = useState<Equipment | null>(null);

  const freeEquip = useMemo(() => {
    const busy = new Set(sessions.map((s) => s.equipment_id));
    return equipments.find((e) => e.active && e.status === "free" && !busy.has(e.id)) ?? null;
  }, [equipments, sessions]);

  const next = waiting[0];

  if (!next || !freeEquip) return null;

  const Icon = freeEquip.type === "computer" ? Monitor : Gamepad2;

  return (
    <>
      <Card className="p-4 rounded-xl border-primary/40 bg-primary/5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <BellRing className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              Próximo da fila: <span className="text-primary">{next.customer_name ?? "—"}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Icon className="size-3.5" /> Equipamento livre: <span className="text-foreground font-medium">{freeEquip.name}</span>
            </div>
          </div>
        </div>
        <Button size="sm" className="rounded-lg" onClick={() => setTarget(freeEquip)}>
          <Play className="size-4 mr-2" /> Iniciar Sessão
        </Button>
      </Card>

      <StartSessionDialog
        equipment={target}
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
      />
    </>
  );
}
