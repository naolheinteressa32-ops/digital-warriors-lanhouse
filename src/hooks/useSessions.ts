import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useActiveSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("sessions")
        .select("*")
        .eq("status", "active");

      if (mounted && rows) setSessions(rows);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("sessions-changes")
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
  }, []);

  return { sessions, loading };
}
