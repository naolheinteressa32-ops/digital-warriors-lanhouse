import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

// Note: sensitive columns (salary, hire_date, permission_level, permissions)
// are revoked from authenticated users at the column level. They are
// accessed only through the manager-only `get_employees_admin` RPC.
const SAFE_COLUMNS = "id,name,role,active,created_at";

export function useProfiles() {
  const [data, setData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const { data: rows } = await supabase.from("profiles").select(SAFE_COLUMNS).order("name");
      if (mounted && rows) setData(rows as unknown as Profile[]);
      setLoading(false);
    };
    fetchAll();
    const channel = supabase
      .channel("profiles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchAll())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return { profiles: data, loading };
}

export type EmployeeAdminRow = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  created_at: string;
  salary: number | null;
  hire_date: string | null;
  permission_level: string;
  permissions: Record<string, boolean> | null;
};

export function useEmployeesAdmin(enabled: boolean) {
  const [rows, setRows] = useState<EmployeeAdminRow[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) { setRows([]); setLoading(false); return; }
    let mounted = true;
    const fetchAll = async () => {
      const { data } = await (supabase as any).rpc("get_employees_admin");
      if (!mounted) return;
      setRows((data ?? []) as EmployeeAdminRow[]);
      setLoading(false);
    };
    fetchAll();
    const channel = supabase
      .channel("profiles-admin-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchAll())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [enabled]);

  return { rows, loading };
}
