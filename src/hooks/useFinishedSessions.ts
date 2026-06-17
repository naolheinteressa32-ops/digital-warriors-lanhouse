import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@/types";

export function useFinishedSessions(days = 30) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data: rows, error: err } = await supabase
        .from("sessions")
        .select("*")
        .eq("status", "finished")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(1000);

      if (mounted) {
        if (err) setError(err.message);
        else setSessions(rows ?? []);
        setLoading(false);
      }
    };

    fetchAll();

    // ✅ PADRÃO CORRETO: .on() ANTES de .subscribe()
    const channel = supabase
      .channel(`finished-sessions-${days}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
        },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [days]);

  return { sessions, loading, error };
}
