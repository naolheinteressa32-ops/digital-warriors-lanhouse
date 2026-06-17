import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CashRegister } from "@/types";

export function useCashRegisters() {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("cash_registers")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(500);

      if (mounted && rows) setRegisters(rows);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("cash-registers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cash_registers",
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

  return { registers, loading };
}
