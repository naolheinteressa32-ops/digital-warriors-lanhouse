import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPostgresChanges } from "@/hooks/useRealtimeSubscription";
import type { Session } from "@/types";

export function useActiveSessions() {
  const [data, setData] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("sessions").select("*").eq("status", "active")
        .order("started_at", { ascending: false });
      if (mounted && rows) setData(rows);
      setLoading(false);
    };
    fetchAll();

    const unsubscribe = subscribeToPostgresChanges(
      "sessions-changes",
      { event: "*", schema: "public", table: "sessions" },
      () => { fetchAll(); },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { sessions: data, loading };
}
