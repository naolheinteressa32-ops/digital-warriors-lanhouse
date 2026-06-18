import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPostgresChanges } from "@/hooks/useRealtimeSubscription";

export type FinancialTransaction = {
  id: string;
  type: "income" | "expense" | string;
  category: string;
  description: string;
  amount: number;
  occurred_at: string;
  payment_method: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useFinancialTransactions() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data } = await (supabase as any)
        .from("financial_transactions")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(1000);
      if (!mounted) return;
      setTransactions(data ?? []);
      setLoading(false);
    };
    fetchAll();
    const unsubscribe = subscribeToPostgresChanges(
      "fin-tx-changes",
      { event: "*", schema: "public", table: "financial_transactions" },
      () => fetchAll(),
    );
    return () => { mounted = false; unsubscribe(); };
  }, []);

  return { transactions, loading };
}
