import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Equipment } from "@/types";

export function useEquipments() {
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data: rows } = await supabase.from("equipments").select("*").order("name");
      if (mounted && rows) setData(rows);
      setLoading(false);
    };
    fetchAll();

    const channel = supabase
      .channel("equipments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "equipments" }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { equipments: data, loading };
}
