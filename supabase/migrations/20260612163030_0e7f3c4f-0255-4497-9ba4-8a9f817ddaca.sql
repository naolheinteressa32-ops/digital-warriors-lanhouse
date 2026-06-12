
-- cash_registers
CREATE TABLE public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_amount numeric(10,2) NOT NULL DEFAULT 0,
  expected_amount numeric(10,2),
  counted_amount numeric(10,2),
  difference numeric(10,2),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  notes text,
  closed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_registers TO authenticated;
GRANT ALL ON public.cash_registers TO service_role;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendant sees own caixas" ON public.cash_registers
  FOR SELECT TO authenticated
  USING (attendant_id = auth.uid() OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "attendant opens own caixa" ON public.cash_registers
  FOR INSERT TO authenticated
  WITH CHECK (attendant_id = auth.uid());

CREATE POLICY "attendant updates own caixa, manager any" ON public.cash_registers
  FOR UPDATE TO authenticated
  USING (attendant_id = auth.uid() OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (attendant_id = auth.uid() OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "manager deletes caixa" ON public.cash_registers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

-- employee_reports
CREATE TABLE public.employee_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('observation','problem','suggestion')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  read_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_reports TO authenticated;
GRANT ALL ON public.employee_reports TO service_role;
ALTER TABLE public.employee_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "author sees own, manager sees all" ON public.employee_reports
  FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "author creates report" ON public.employee_reports
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "author edits own unread, manager any" ON public.employee_reports
  FOR UPDATE TO authenticated
  USING (
    (author_id = auth.uid() AND read = false)
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    author_id = auth.uid() OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "manager deletes report" ON public.employee_reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER set_updated_at_cash_registers BEFORE UPDATE ON public.cash_registers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_employee_reports BEFORE UPDATE ON public.employee_reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
