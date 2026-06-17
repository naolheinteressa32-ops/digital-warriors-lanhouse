import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WaitingListRow } from "@/types";

export function useWaitingList() {
  const [waiting, setWaiting] = useState<WaitingListRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("waiting_list")
        .select("*")
        .order("position", { ascending: true });

      if (mounted && rows) setWaiting(rows);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("waiting-list-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiting_list",
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
  }, []);

  return { waiting, loading };
}
