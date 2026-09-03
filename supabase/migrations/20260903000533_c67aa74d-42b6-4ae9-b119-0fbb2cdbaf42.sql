-- 1. Relax user-linked columns
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_attendant_id_fkey;
ALTER TABLE public.sessions ALTER COLUMN attendant_id DROP NOT NULL;

ALTER TABLE public.cash_registers DROP CONSTRAINT IF EXISTS cash_registers_attendant_id_fkey;
ALTER TABLE public.cash_registers DROP CONSTRAINT IF EXISTS cash_registers_closed_by_fkey;
ALTER TABLE public.cash_registers ALTER COLUMN attendant_id DROP NOT NULL;

ALTER TABLE public.employee_reports DROP CONSTRAINT IF EXISTS employee_reports_author_id_fkey;
ALTER TABLE public.employee_reports DROP CONSTRAINT IF EXISTS employee_reports_read_by_fkey;
ALTER TABLE public.employee_reports ALTER COLUMN author_id DROP NOT NULL;

-- 2. Replace all policies with public (anon + authenticated) access
DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOR t IN SELECT unnest(ARRAY['customers','equipments','sessions','waiting_list','cash_registers','employee_reports','promotions','payroll_records','financial_transactions','profiles'])
  LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t || '_public_all', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END;
$$;

-- 3. Admin RPCs no longer require a manager account
CREATE OR REPLACE FUNCTION public.get_employees_admin()
 RETURNS TABLE(id uuid, name text, role text, active boolean, created_at timestamp with time zone, salary numeric, hire_date date, permission_level text, permissions jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT p.id, p.name, p.role, p.active, p.created_at,
           p.salary, p.hire_date, p.permission_level, p.permissions
    FROM public.profiles p
    ORDER BY p.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_employee_admin(_employee_id uuid, _salary numeric, _hire_date date, _permission_level text, _permissions jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
     SET salary = _salary,
         hire_date = _hire_date,
         permission_level = COALESCE(_permission_level, permission_level),
         permissions = COALESCE(_permissions, permissions)
   WHERE id = _employee_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_employees_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_employee_admin(uuid, numeric, date, text, jsonb) TO anon, authenticated;

-- 4. Sensitive employee columns readable again without auth (login removed)
GRANT SELECT (salary, hire_date, permission_level, permissions) ON public.profiles TO anon, authenticated;