import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FinancialTransaction } from "@/types";

export function useFinancialTransactions() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(1000);

      if (mounted && rows) setTransactions(rows);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("fin-ta-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "financial_transactions",
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

  return { transactions, loading };
}
