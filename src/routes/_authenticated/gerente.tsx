import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewManager } from "@/components/dashboard/OverviewManager";
import { ActiveSessionsTab } from "@/components/dashboard/ActiveSessionsTab";
import { EquipmentsGrid } from "@/components/dashboard/EquipmentsGrid";
import { CustomersTab } from "@/components/dashboard/CustomersTab";
import { FuncionariosTab } from "@/components/dashboard/FuncionariosTab";
import { FinanceiroTab } from "@/components/dashboard/FinanceiroTab";
import { HistoricoTab } from "@/components/dashboard/HistoricoTab";
import { RelatoriosTab } from "@/components/dashboard/RelatoriosTab";
import { PromocoesTab } from "@/components/dashboard/PromocoesTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { MovimentoTab } from "@/components/dashboard/MovimentoTab";
import { CaixaTab } from "@/components/dashboard/CaixaTab";
import { RelatoriosInternosTab } from "@/components/dashboard/RelatoriosInternosTab";
import { FolhaPagamentoTab } from "@/components/dashboard/FolhaPagamentoTab";
import { FinanceiroGerencialTab } from "@/components/dashboard/FinanceiroGerencialTab";
import { WaitingQueueAlert } from "@/components/dashboard/WaitingQueueAlert";

export const Route = createFileRoute("/_authenticated/gerente")({
  head: () => ({ meta: [{ title: "Gerência — Digital Warriors Manager" }] }),
  component: GerentePage,
});

function GerentePage() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerência</h1>
        <p className="text-sm text-muted-foreground">Visão completa da operação Digital Warriors</p>
      </div>

      <WaitingQueueAlert />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto flex-nowrap md:flex-wrap h-auto justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="movimento">Movimento</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="staff">Funcionários</TabsTrigger>
          <TabsTrigger value="finance">Financeiro</TabsTrigger>
          <TabsTrigger value="caixa">Caixa</TabsTrigger>
          <TabsTrigger value="payroll">Folha</TabsTrigger>
          <TabsTrigger value="fin-mgmt">Gerencial</TabsTrigger>
          <TabsTrigger value="reports-internal">Relatórios Internos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="promo">Promoções</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewManager /></TabsContent>
        <TabsContent value="movimento"><MovimentoTab /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="sessions"><ActiveSessionsTab /></TabsContent>
        <TabsContent value="equipments"><EquipmentsGrid allowMaintenance /></TabsContent>
        <TabsContent value="customers"><CustomersTab /></TabsContent>
        <TabsContent value="staff"><FuncionariosTab /></TabsContent>
        <TabsContent value="finance"><FinanceiroTab /></TabsContent>
        <TabsContent value="caixa"><CaixaTab /></TabsContent>
        <TabsContent value="payroll"><FolhaPagamentoTab /></TabsContent>
        <TabsContent value="fin-mgmt"><FinanceiroGerencialTab /></TabsContent>
        <TabsContent value="reports-internal"><RelatoriosInternosTab /></TabsContent>
        <TabsContent value="history"><HistoricoTab /></TabsContent>
        <TabsContent value="reports"><RelatoriosTab /></TabsContent>
        <TabsContent value="promo"><PromocoesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
