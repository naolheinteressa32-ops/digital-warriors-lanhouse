import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePromotions() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });

      if (mounted && rows) setPromotions(rows);
      setLoading(false);
    };

    fetchAll();

    // ✅ PADRÃO CORRETO: .on() ANTES de .subscribe()
    const channel = supabase
      .channel("promotions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promotions",
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

  return { promotions, loading };
}
