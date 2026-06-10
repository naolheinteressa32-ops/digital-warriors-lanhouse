import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Equipment = Database["public"]["Tables"]["equipments"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type WaitingListRow = Database["public"]["Tables"]["waiting_list"]["Row"];

export type EquipmentType = "computer" | "console";
export type EquipmentStatus = "free" | "in_use" | "maintenance";
export type SessionStatus = "active" | "finished" | "cancelled";
export type UserRole = "attendant" | "manager";
export type PaymentMethod = "cash" | "pix" | "credit" | "debit";

export const DURATION_OPTIONS = [
  { label: "30 minutos", minutes: 30 },
  { label: "1 hora", minutes: 60 },
  { label: "2 horas", minutes: 120 },
  { label: "3 horas", minutes: 180 },
] as const;
