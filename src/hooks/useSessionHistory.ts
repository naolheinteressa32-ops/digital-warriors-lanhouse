import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSessionHistory(days = 30) {
  const [sessions, setSessions] = useState<any[]>([]);
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
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(2000);

      if (mounted) {
        if (err) setError(err.message);
        else setSessions(rows ?? []);
        setLoading(false);
      }
    };

    fetchAll();

    // ✅ PADRÃO CORRETO: .on() ANTES de .subscribe()
    const channel = supabase
      .channel(`session-history-${days}`)
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
