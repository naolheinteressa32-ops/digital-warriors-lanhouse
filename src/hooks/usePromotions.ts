import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    const channel = supabase
      .channel("promotions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "promotions" }, () => fetchAll())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return { promotions: data, loading };
}
