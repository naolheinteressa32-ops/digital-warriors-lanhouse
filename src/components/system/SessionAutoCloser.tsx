import { useEffect, useRef } from "react";
import { useActiveSessions } from "@/hooks/useSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Watches active sessions and automatically finishes any whose `ends_at` is in
 * the past. The update is idempotent (filters on status='active') so multiple
 * clients running this loop won't double-bill or double-toast — only the first
 * write succeeds, and we de-dupe locally via `closing` ref.
 */
export function SessionAutoCloser() {
  const { user } = useAuth();
  const { sessions } = useActiveSessions();
  const closing = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const tick = async () => {
      const now = Date.now();
      const expired = sessions.filter(
        (s) => new Date(s.ends_at).getTime() <= now && !closing.current.has(s.id),
      );
      for (const s of expired) {
        closing.current.add(s.id);
        const endedAt = new Date().toISOString();
        const { data, error } = await supabase
          .from("sessions")
          .update({ status: "finished", ended_at: endedAt })
          .eq("id", s.id)
          .eq("status", "active")
          .select("id");
        if (!error && data && data.length > 0) {
          await supabase.from("equipments").update({ status: "free" }).eq("id", s.equipment_id);
          toast.info(`Tempo encerrado — ${s.equipment_name}`, {
            description: s.customer_name ? `Cliente: ${s.customer_name}` : undefined,
          });
        } else {
          // Another client got there first or row no longer active — allow retry later.
          closing.current.delete(s.id);
        }
      }
    };
    tick();
    const id = setInterval(tick, 5_000);
    return () => clearInterval(id);
  }, [sessions, user]);

  return null;
}
