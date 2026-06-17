import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PayrollRecord } from "@/types";

export function usePayroll() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("payroll_records")
        .select("*")
        .order("reference_month", { ascending: false })
        .limit(500);

      if (mounted && rows) setRecords(rows);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("payroll-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payroll_records",
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

  return { records, loading };
}
