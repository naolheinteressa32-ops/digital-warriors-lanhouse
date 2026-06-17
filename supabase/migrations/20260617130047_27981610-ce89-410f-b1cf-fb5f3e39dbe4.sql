
-- Revoke direct read access to sensitive employee columns from regular authenticated users
REVOKE SELECT (salary, hire_date, permission_level, permissions) ON public.profiles FROM authenticated;
-- service_role keeps full access (already granted via ALL)

-- Manager-only function: full employee list with sensitive fields
CREATE OR REPLACE FUNCTION public.get_employees_admin()
RETURNS TABLE (
  id uuid,
  name text,
  role text,
  active boolean,
  created_at timestamptz,
  salary numeric,
  hire_date date,
  permission_level text,
  permissions jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'manager') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT p.id, p.name, p.role, p.active, p.created_at,
           p.salary, p.hire_date, p.permission_level, p.permissions
    FROM public.profiles p
    ORDER BY p.name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_employees_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_employees_admin() TO authenticated;

-- Manager-only function: update sensitive employee fields
CREATE OR REPLACE FUNCTION public.update_employee_admin(
  _employee_id uuid,
  _salary numeric,
  _hire_date date,
  _permission_level text,
  _permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'manager') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.profiles
     SET salary = _salary,
         hire_date = _hire_date,
         permission_level = COALESCE(_permission_level, permission_level),
         permissions = COALESCE(_permissions, permissions)
   WHERE id = _employee_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_employee_admin(uuid, numeric, date, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_employee_admin(uuid, numeric, date, text, jsonb) TO authenticated;
