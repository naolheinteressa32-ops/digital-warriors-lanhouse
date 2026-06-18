import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPostgresChanges } from "@/hooks/useRealtimeSubscription";
import type { CashRegister } from "@/types";

export function useCashRegisters() {
  const [data, setData] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("cash_registers")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(500);
      if (!mounted) return;
      setData(rows ?? []);
      setLoading(false);
    };
    fetchAll();
    const unsubscribe = subscribeToPostgresChanges(
      "cash-registers-changes",
      { event: "*", schema: "public", table: "cash_registers" },
      () => fetchAll(),
    );
    return () => { mounted = false; unsubscribe(); };
  }, []);

  return { registers: data, loading };
}
