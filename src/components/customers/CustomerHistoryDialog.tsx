import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Customer, Session } from "@/types";
import { formatBRL, formatDateTime } from "@/lib/format";
import { Loader2, Monitor, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function CustomerHistoryDialog({ customer, open, onOpenChange }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customer) return;
    setLoading(true);
    supabase
      .from("sessions")
      .select("*")
      .eq("customer_id", customer.id)
      .order("started_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setSessions(data ?? []);
        setLoading(false);
      });
  }, [open, customer]);

  const total = sessions.reduce((acc, s) => acc + Number(s.value || 0) - Number(s.discount || 0), 0);
  const finishedCount = sessions.filter((s) => s.status === "finished").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico — {customer?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">Sessões finalizadas</div>
            <div className="text-2xl font-bold">{finishedCount}</div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">Total gasto</div>
            <div className="text-2xl font-bold text-primary">{formatBRL(total)}</div>
          </div>
        </div>

        <div className="overflow-auto flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">Nenhuma sessão registrada.</div>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {s.equipment_type === "console" ? <Gamepad2 className="size-4 text-primary shrink-0" /> : <Monitor className="size-4 text-primary shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.equipment_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(s.started_at)} · {s.duration_minutes} min
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatBRL(Number(s.value))}</div>
                    <Badge variant={s.status === "finished" ? "secondary" : s.status === "active" ? "default" : "outline"} className="text-[10px]">
                      {s.status === "finished" ? "Finalizada" : s.status === "active" ? "Ativa" : "Cancelada"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
