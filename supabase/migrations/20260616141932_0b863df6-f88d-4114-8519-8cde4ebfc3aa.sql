
-- Expand profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS permission_level TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- payroll_records
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_records TO authenticated;
GRANT ALL ON public.payroll_records TO service_role;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll select" ON public.payroll_records
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR employee_id = auth.uid());

CREATE POLICY "payroll insert manager" ON public.payroll_records
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "payroll update manager" ON public.payroll_records
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "payroll delete manager" ON public.payroll_records
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER trg_payroll_updated_at BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- financial_transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_tx manager all" ON public.financial_transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER trg_fin_tx_updated_at BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Allow managers to update extended profile fields (existing policies remain)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles manager update') THEN
    CREATE POLICY "profiles manager update" ON public.profiles
      FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'manager'))
      WITH CHECK (public.has_role(auth.uid(), 'manager'));
  END IF;
END $$;
