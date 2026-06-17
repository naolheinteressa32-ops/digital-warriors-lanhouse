import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PayrollRecord = {
  id: string;
  employee_id: string;
  reference_month: string;
  base_amount: number;
  bonus: number;
  deductions: number;
  net_amount: number;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function usePayroll() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data } = await (supabase as any)
        .from("payroll_records")
        .select("*")
        .order("reference_month", { ascending: false })
        .limit(500);
      if (!mounted) return;
      setRecords(data ?? []);
      setLoading(false);
    };
    fetchAll();
    const channel = supabase
      .channel("payroll-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_records" }, () => fetchAll())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return { records, loading };
}
