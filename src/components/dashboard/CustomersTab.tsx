import { useMemo, useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { CustomerHistoryDialog } from "@/components/customers/CustomerHistoryDialog";
import type { Customer } from "@/types";
import { Search, Plus, Pencil, History, Loader2, UserRound } from "lucide-react";
import { formatCPF, formatPhone, onlyDigits } from "@/lib/format";

export function CustomersTab() {
  const { customers, loading } = useCustomers();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = onlyDigits(search);
    if (!q) return customers;
    return customers.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (qDigits && c.cpf && onlyDigits(c.cpf).includes(qDigits)) return true;
      return false;
    });
  }, [customers, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Card className="p-3 rounded-xl flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </Card>
        <Button className="rounded-lg" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="size-4 mr-2" /> Novo
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 rounded-xl text-center text-muted-foreground">
          {customers.length === 0 ? "Nenhum cliente cadastrado." : "Nenhum cliente encontrado."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="p-5 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0"><UserRound className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.email || "—"}</div>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">CPF:</span> {c.cpf ? formatCPF(c.cpf) : "—"}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {c.phone ? formatPhone(c.phone) : "—"}</div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                  <Pencil className="size-4 mr-2" /> Editar
                </Button>
                <Button size="sm" variant="secondary" className="flex-1 rounded-lg" onClick={() => setHistoryCustomer(c)}>
                  <History className="size-4 mr-2" /> Histórico
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CustomerDialog customer={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
      <CustomerHistoryDialog customer={historyCustomer} open={!!historyCustomer} onOpenChange={(o) => !o && setHistoryCustomer(null)} />
    </div>
  );
}
