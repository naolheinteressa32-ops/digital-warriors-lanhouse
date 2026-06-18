import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

    const channel = supabase
      .channel(`sessions-changes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { sessions: data, loading };
}
