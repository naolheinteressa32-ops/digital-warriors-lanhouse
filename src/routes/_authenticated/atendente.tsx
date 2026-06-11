import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewAttendant } from "@/components/dashboard/OverviewAttendant";
import { EquipmentsGrid } from "@/components/dashboard/EquipmentsGrid";
import { CustomersTab } from "@/components/dashboard/CustomersTab";
import { ActiveSessionsTab } from "@/components/dashboard/ActiveSessionsTab";
import { WaitingListTab } from "@/components/dashboard/WaitingListTab";

export const Route = createFileRoute("/_authenticated/atendente")({
  head: () => ({ meta: [{ title: "Atendimento — Digital Warriors Manager" }] }),
  component: AtendentePage,
});

function AtendentePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atendimento</h1>
        <p className="text-sm text-muted-foreground">Dashboard do atendente — gerencie sessões em tempo real</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="waiting">Fila de Espera</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewAttendant /></TabsContent>
        <TabsContent value="equipments"><EquipmentsGrid /></TabsContent>
        <TabsContent value="customers"><CustomersTab /></TabsContent>
        <TabsContent value="sessions"><ActiveSessionsTab /></TabsContent>
        <TabsContent value="waiting"><WaitingListTab /></TabsContent>
      </Tabs>
    </div>
  );
}
