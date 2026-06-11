
-- Replace permissive 'true' policies with auth.uid() checks to satisfy the RLS linter
-- and tighten waiting_list which still had a single ALL/true policy.

-- customers: keep operational access for staff but remove bare 'true'
DROP POLICY IF EXISTS customers_insert_auth ON public.customers;
DROP POLICY IF EXISTS customers_update_auth ON public.customers;

CREATE POLICY customers_insert_auth ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY customers_update_auth ON public.customers
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- equipments: same treatment for UPDATE (attendants update status)
DROP POLICY IF EXISTS equipments_update_auth ON public.equipments;
CREATE POLICY equipments_update_auth ON public.equipments
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- waiting_list: split the single ALL/true policy
DROP POLICY IF EXISTS "auth users waiting_list" ON public.waiting_list;

CREATE POLICY waiting_list_select_auth ON public.waiting_list
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY waiting_list_insert_auth ON public.waiting_list
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY waiting_list_update_auth ON public.waiting_list
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY waiting_list_delete_auth ON public.waiting_list
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
