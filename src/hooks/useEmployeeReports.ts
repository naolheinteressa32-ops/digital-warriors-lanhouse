import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPostgresChanges } from "@/hooks/useRealtimeSubscription";
import type { EmployeeReport } from "@/types";

export function useEmployeeReports() {
  const [data, setData] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("employee_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!mounted) return;
      setData(rows ?? []);
      setLoading(false);
    };
    fetchAll();
    const unsubscribe = subscribeToPostgresChanges(
      "employee-reports-changes",
      { event: "*", schema: "public", table: "employee_reports" },
      () => fetchAll(),
    );
    return () => { mounted = false; unsubscribe(); };
  }, []);

  return { reports: data, loading };
}
