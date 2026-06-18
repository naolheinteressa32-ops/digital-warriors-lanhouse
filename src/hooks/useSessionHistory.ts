import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPostgresChanges } from "@/hooks/useRealtimeSubscription";
import type { Session } from "@/types";

export function useSessionHistory(days = 30) {
  const [data, setData] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data: rows, error: err } = await supabase
        .from("sessions").select("*")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(2000);
      if (!mounted) return;
      if (err) setError(err.message);
      else setData(rows ?? []);
      setLoading(false);
    };
    fetchAll();
    const unsubscribe = subscribeToPostgresChanges(
      `session-history-${days}`,
      { event: "*", schema: "public", table: "sessions" },
      () => fetchAll(),
    );
    return () => { mounted = false; unsubscribe(); };
  }, [days]);

  return { sessions: data, loading, error };
}
