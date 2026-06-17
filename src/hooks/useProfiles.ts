import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const { data: rows } = await supabase
        .from("profiles")
        .select("*")
        .order("name");

      if (mounted && rows) setProfiles(rows);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
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

  return { profiles, loading };
}
