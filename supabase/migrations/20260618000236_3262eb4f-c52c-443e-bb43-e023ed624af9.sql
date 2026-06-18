
-- 1. Payroll: managers only can SELECT
DROP POLICY IF EXISTS "payroll select" ON public.payroll_records;
CREATE POLICY "payroll select manager" ON public.payroll_records
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'manager'));

-- 2. Profiles: prevent self-escalation of sensitive columns
DROP POLICY IF EXISTS "profiles_update_self_no_role_change" ON public.profiles;
CREATE POLICY "profiles_update_self_safe_columns" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND active = (SELECT p.active FROM public.profiles p WHERE p.id = auth.uid())
    AND salary IS NOT DISTINCT FROM (SELECT p.salary FROM public.profiles p WHERE p.id = auth.uid())
    AND hire_date IS NOT DISTINCT FROM (SELECT p.hire_date FROM public.profiles p WHERE p.id = auth.uid())
    AND permission_level IS NOT DISTINCT FROM (SELECT p.permission_level FROM public.profiles p WHERE p.id = auth.uid())
    AND permissions IS NOT DISTINCT FROM (SELECT p.permissions FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 3. Lock down SECURITY DEFINER admin RPCs to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_employees_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_employee_admin(uuid, numeric, date, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_employees_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_employee_admin(uuid, numeric, date, text, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
