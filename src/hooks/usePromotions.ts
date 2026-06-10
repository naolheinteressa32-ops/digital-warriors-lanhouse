import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  percent_off: number;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export function usePromotions() {
  const [data, setData] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const client = supabase as unknown as { from: (t: string) => { select: (c: string) => { order: (c: string, opts: { ascending: boolean }) => Promise<{ data: Promotion[] | null }> } } };
      const { data: rows } = await client
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (mounted && rows) setData(rows as unknown as Promotion[]);
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
