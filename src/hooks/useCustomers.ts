import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Customer } from "@/types";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (mounted && rows) setCustomers(rows);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("customers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
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

  return { customers, loading };
}
