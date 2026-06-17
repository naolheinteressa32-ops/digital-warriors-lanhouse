import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EmployeeReport } from "@/types";

export function useEmployeeReports() {
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("employee_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (mounted && rows) setReports(rows);
      setLoading(false);
    };

    fetchAll();

    // ✅ PADRÃO CORRETO: .on() ANTES de .subscribe()
    const channel = supabase
      .channel("employee-reports-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employee_reports",
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

  return { reports, loading };
}
