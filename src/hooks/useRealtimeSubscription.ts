import { supabase } from "@/integrations/supabase/client";

type PostgresChangesFilter = {
  event: "*" | "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  filter?: string;
};

type RealtimeRegistryEntry = {
  listeners: Set<() => void>;
  remove: () => void;
};

let channelSequence = 0;
const postgresChangesRegistry = new Map<string, RealtimeRegistryEntry>();

function getRegistryKey(filter: PostgresChangesFilter) {
  return JSON.stringify(filter);
}

function getUniqueChannelName(baseName: string) {
  channelSequence += 1;
  return `${baseName}-${Date.now().toString(36)}-${channelSequence}`;
}

export function subscribeToPostgresChanges(
  baseChannelName: string,
  filter: PostgresChangesFilter,
  listener: () => void,
) {
  const key = getRegistryKey(filter);
  let entry = postgresChangesRegistry.get(key);

  if (!entry) {
    const listeners = new Set<() => void>();
    const channel = supabase
      .channel(getUniqueChannelName(baseChannelName))
      .on("postgres_changes", filter, () => {
        for (const activeListener of Array.from(listeners)) activeListener();
      })
      .subscribe();

    entry = {
      listeners,
      remove: () => {
        void supabase.removeChannel(channel);
      },
    };
    postgresChangesRegistry.set(key, entry);
  }

  entry.listeners.add(listener);

  let closed = false;
  return () => {
    if (closed) return;
    closed = true;

    const current = postgresChangesRegistry.get(key);
    if (!current) return;

    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      postgresChangesRegistry.delete(key);
      current.remove();
    }
  };
}