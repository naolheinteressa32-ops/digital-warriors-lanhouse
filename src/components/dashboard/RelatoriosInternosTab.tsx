import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployeeReports } from "@/hooks/useEmployeeReports";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import { MessageSquare, Loader2, CheckCheck, AlertTriangle, Lightbulb, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ReportType } from "@/types";

const TYPE_LABELS: Record<ReportType, string> = {
  observation: "Observação",
  problem: "Problema",
  suggestion: "Sugestão",
};

const TYPE_ICONS: Record<ReportType, typeof MessageSquare> = {
  observation: MessageSquare,
  problem: AlertTriangle,
  suggestion: Lightbulb,
};

export function RelatoriosInternosTab() {
  const { user, role } = useAuth();
  const isManager = role === "manager";
  const { reports, loading } = useEmployeeReports();
  const { profiles } = useProfiles();
  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [profiles]);

  const [filterType, setFilterType] = useState<"all" | ReportType>("all");
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterRead === "unread" && r.read) return false;
      if (filterRead === "read" && !r.read) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.title.toLowerCase().includes(s) && !r.message.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [reports, filterType, filterRead, search]);

  const markRead = async (id: string, read: boolean) => {
    const { error } = await supabase.from("employee_reports").update({
      read,
      read_at: read ? new Date().toISOString() : null,
      read_by: read ? user?.id ?? null : null,
    }).eq("id", id);
    if (error) toast.error("Erro", { description: error.message });
  };

  return (
    <div className="space-y-4">
      <NewReportCard userId={user!.id} />

      <Card className="p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm font-semibold">
            {isManager ? "Relatórios da equipe" : "Meus relatórios"}
          </div>
          <Badge variant="secondary">{filtered.length} {filtered.length === 1 ? "item" : "itens"}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="observation">Observação</SelectItem>
              <SelectItem value="problem">Problema</SelectItem>
              <SelectItem value="suggestion">Sugestão</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRead} onValueChange={(v) => setFilterRead(v as typeof filterRead)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="unread">Não lidos</SelectItem>
              <SelectItem value="read">Lidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Nenhum relatório encontrado.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const Icon = TYPE_ICONS[r.type as ReportType] ?? MessageSquare;
              return (
                <div key={r.id} className={`rounded-lg border border-border p-3 space-y-2 ${r.read ? "opacity-70" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{r.title}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">{TYPE_LABELS[r.type as ReportType]}</Badge>
                        {r.read ? (
                          <Badge variant="secondary" className="text-[10px]"><Eye className="size-3 mr-1" />Lido</Badge>
                        ) : (
                          <Badge className="text-[10px]">Novo</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {profileMap.get(r.author_id) ?? "—"} • {formatDateTime(r.created_at)}
                      </div>
                      <div className="text-sm mt-2 whitespace-pre-wrap">{r.message}</div>
                    </div>
                  </div>
                  {isManager && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant={r.read ? "outline" : "default"} onClick={() => markRead(r.id, !r.read)} className="rounded-lg">
                        <CheckCheck className="size-3.5 mr-1" />
                        {r.read ? "Marcar como não lido" : "Marcar como lido"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function NewReportCard({ userId }: { userId: string }) {
  const [type, setType] = useState<ReportType>("observation");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Preencha título e mensagem"); return; }
    if (title.length > 120) { toast.error("Título muito longo"); return; }
    if (message.length > 2000) { toast.error("Mensagem muito longa"); return; }
    setBusy(true);
    const { error } = await supabase.from("employee_reports").insert({
      author_id: userId,
      type,
      title: title.trim(),
      message: message.trim(),
    });
    setBusy(false);
    if (error) toast.error("Erro", { description: error.message });
    else { toast.success("Relatório enviado"); setTitle(""); setMessage(""); setType("observation"); }
  };

  return (
    <Card className="p-5 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-primary" />
        <div className="font-semibold">Novo relatório</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="observation">Observação</SelectItem>
              <SelectItem value="problem">Problema</SelectItem>
              <SelectItem value="suggestion">Sugestão</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Resumo curto" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Mensagem</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={3} placeholder="Descreva em detalhes…" />
      </div>
      <Button onClick={submit} disabled={busy} className="rounded-lg">
        {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : <MessageSquare className="size-4 mr-2" />}
        Enviar
      </Button>
    </Card>
  );
}
