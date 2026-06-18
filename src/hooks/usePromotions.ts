import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPostgresChanges } from "@/hooks/useRealtimeSubscription";
import type { Database } from "@/integrations/supabase/types";

export type Promotion = Database["public"]["Tables"]["promotions"]["Row"];

export function usePromotions() {
  const [data, setData] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (mounted && rows) setData(rows);
      setLoading(false);
    };
    fetchAll();
    const unsubscribe = subscribeToPostgresChanges(
      "promotions-changes",
      { event: "*", schema: "public", table: "promotions" },
      () => fetchAll(),
    );
    return () => { mounted = false; unsubscribe(); };
  }, []);

  return { promotions: data, loading };
}
