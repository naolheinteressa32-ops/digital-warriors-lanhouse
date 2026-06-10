import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/gerente")({
  head: () => ({ meta: [{ title: "Gerência — CyberLAN Manager" }] }),
  component: () => (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Gerência</h1>
      <Card className="p-8 rounded-xl text-center text-muted-foreground">
        Painel do gerente — disponível em uma próxima etapa.
      </Card>
    </div>
  ),
});
