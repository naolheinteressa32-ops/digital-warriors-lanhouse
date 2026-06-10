import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveSessions } from "@/hooks/useSessions";
import { SessionTimer } from "@/components/sessions/SessionTimer";
import { formatBRL, formatDateTime } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Monitor, Gamepad2, Square } from "lucide-react";
import { useState } from "react";

export function ActiveSessionsTab() {
  const { sessions, loading } = useActiveSessions();
  const [ending, setEnding] = useState<string | null>(null);

  const endSession = async (sessionId: string, equipmentId: string) => {
    setEnding(sessionId);
    const { error } = await supabase.from("sessions")
      .update({ status: "finished", ended_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (!error) await supabase.from("equipments").update({ status: "free" }).eq("id", equipmentId);
    setEnding(null);
    if (error) toast.error("Erro ao encerrar", { description: error.message });
    else toast.success("Sessão encerrada");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (sessions.length === 0) return <Card className="p-12 rounded-xl text-center text-muted-foreground">Nenhuma sessão ativa.</Card>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessions.map((s) => {
        const expired = new Date(s.ends_at).getTime() <= Date.now();
        return (
          <Card key={s.id} className={`p-5 rounded-xl space-y-3 ${expired ? "ring-2 ring-destructive" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {s.equipment_type === "computer" ? <Monitor className="size-5 text-primary" /> : <Gamepad2 className="size-5 text-primary" />}
                <div>
                  <div className="font-semibold">{s.equipment_name}</div>
                  <div className="text-xs text-muted-foreground">{s.customer_name ?? "Avulso"}</div>
                </div>
              </div>
            </div>
            <SessionTimer session={s} />
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Início: {formatDateTime(s.started_at)}</div>
              <div>Fim previsto: {formatDateTime(s.ends_at)}</div>
              <div>Valor: <span className="text-foreground font-medium">{formatBRL(Number(s.value))}</span></div>
            </div>
            <Button size="sm" variant="destructive" className="w-full rounded-lg" disabled={ending === s.id} onClick={() => endSession(s.id, s.equipment_id)}>
              {ending === s.id ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Square className="size-4 mr-2" />}
              Encerrar
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
