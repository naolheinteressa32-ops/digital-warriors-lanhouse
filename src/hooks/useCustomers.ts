import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPostgresChanges } from "@/hooks/useRealtimeSubscription";
import type { Customer } from "@/types";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("customers").select("*").order("name");
      if (mounted && data) setCustomers(data);
      if (mounted) setLoading(false);
    };
    load();

    const unsubscribe = subscribeToPostgresChanges(
      "customers-changes",
      { event: "*", schema: "public", table: "customers" },
      () => load(),
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { customers, loading };
}
