ALTER TABLE public.equipments ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.cash_registers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_registers;