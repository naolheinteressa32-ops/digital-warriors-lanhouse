import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Equipment } from "@/types";

export function useEquipments(opts: { includeInactive?: boolean } = {}) {
  const { includeInactive = false } = opts;
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      let q = supabase.from("equipments").select("*").order("name");
      if (!includeInactive) q = q.eq("active", true);
      const { data: rows } = await q;

      if (mounted && rows) setData(rows);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel(`equipments-changes-${includeInactive ? "all" : "active"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "equipments",
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
  }, [includeInactive]);

  return { equipments: data, loading };
}
