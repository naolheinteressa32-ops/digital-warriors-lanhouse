import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPostgresChanges } from "@/hooks/useRealtimeSubscription";
import type { WaitingListRow } from "@/types";

export function useWaitingList() {
  const [data, setData] = useState<WaitingListRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("waiting_list").select("*").order("position", { ascending: true });
      if (mounted && rows) setData(rows);
      setLoading(false);
    };
    fetchAll();
    const unsubscribe = subscribeToPostgresChanges(
      "waiting-list-changes",
      { event: "*", schema: "public", table: "waiting_list" },
      () => fetchAll(),
    );
    return () => { mounted = false; unsubscribe(); };
  }, []);

  return { waiting: data, loading };
}
