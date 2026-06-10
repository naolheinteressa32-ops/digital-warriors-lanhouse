import { Badge } from "@/components/ui/badge";
import type { EquipmentStatus } from "@/types";

const MAP: Record<EquipmentStatus, { label: string; className: string }> = {
  free: { label: "Livre", className: "bg-success/20 text-success border-success/30" },
  in_use: { label: "Em Uso", className: "bg-primary/20 text-primary border-primary/30" },
  maintenance: { label: "Manutenção", className: "bg-warning/20 text-warning border-warning/30" },
};

export function StatusBadge({ status }: { status: EquipmentStatus }) {
  const cfg = MAP[status];
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}
