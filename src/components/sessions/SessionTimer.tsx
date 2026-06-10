import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatRemaining } from "@/lib/format";
import type { Session } from "@/types";

export function SessionTimer({ session }: { session: Session }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = new Date(session.started_at).getTime();
  const end = new Date(session.ends_at).getTime();
  const total = Math.max(1, end - start);
  const elapsed = Math.min(total, Math.max(0, now - start));
  const remaining = end - now;
  const progress = (elapsed / total) * 100;
  const expired = remaining <= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`font-mono text-lg font-bold ${expired ? "text-destructive" : ""}`}>
          {expired ? "00:00" : formatRemaining(remaining)}
        </span>
        {expired && <Badge variant="destructive">Tempo Esgotado</Badge>}
      </div>
      <Progress value={progress} className={expired ? "[&>div]:bg-destructive" : ""} />
    </div>
  );
}
