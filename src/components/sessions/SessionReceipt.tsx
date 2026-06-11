import logo from "@/assets/logo.png";
import { formatBRL, formatDateTime } from "@/lib/format";

export interface ReceiptData {
  customerName: string;
  equipmentName: string;
  equipmentType: "computer" | "console";
  durationMinutes: number;
  value: number;
  discount: number;
  finalValue: number;
  paymentMethod: "pix" | "cash" | "credit" | "debit";
  cashReceived?: number;
  change?: number;
  attendantName: string;
  startedAt: string;
  endsAt: string;
}

const PAYMENT_LABEL: Record<ReceiptData["paymentMethod"], string> = {
  pix: "PIX",
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function SessionReceipt({ data }: { data: ReceiptData }) {
  return (
    <div data-print-receipt className="bg-card rounded-lg border border-border p-6 text-sm space-y-4 font-mono">
      <div className="flex flex-col items-center gap-2 pb-3 border-b border-dashed border-border">
        <img src={logo} alt="Digital Warriors" className="size-16 rounded" />
        <div className="text-lg font-bold tracking-wide">DIGITAL WARRIORS</div>
        <div className="text-xs text-muted-foreground">Comprovante de Sessão</div>
      </div>

      <div className="space-y-1.5">
        <Row label="Cliente" value={data.customerName} />
        <Row label="Equipamento" value={data.equipmentName} />
        <Row label="Tipo" value={data.equipmentType === "computer" ? "Computador" : "Videogame"} />
        <Row label="Duração" value={formatDuration(data.durationMinutes)} />
        <Row label="Início" value={formatDateTime(data.startedAt)} />
        <Row label="Término previsto" value={formatDateTime(data.endsAt)} />
        <Row label="Atendente" value={data.attendantName} />
      </div>

      <div className="pt-3 border-t border-dashed border-border space-y-1.5">
        <Row label="Subtotal" value={formatBRL(data.value)} />
        {data.discount > 0 && <Row label="Desconto" value={`- ${formatBRL(data.discount)}`} />}
        <Row label="Total" value={formatBRL(data.finalValue)} strong />
        <Row label="Pagamento" value={PAYMENT_LABEL[data.paymentMethod]} />
        {data.paymentMethod === "cash" && data.cashReceived !== undefined && (
          <>
            <Row label="Recebido" value={formatBRL(data.cashReceived)} />
            <Row label="Troco" value={formatBRL(data.change ?? 0)} />
          </>
        )}
      </div>

      <div className="pt-3 border-t border-dashed border-border text-center text-xs text-muted-foreground">
        Obrigado pela preferência!
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "text-base font-bold text-primary" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
