
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id and role = _role and active = true
  )
$$;

revoke execute on function public.has_role(uuid, text) from public;
revoke execute on function public.has_role(uuid, text) from anon;
grant execute on function public.has_role(uuid, text) to authenticated;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

drop policy if exists "auth users insert profiles" on public.profiles;
drop policy if exists "auth users read profiles"   on public.profiles;
drop policy if exists "auth users update profiles" on public.profiles;

create policy "profiles_select_self_or_manager"
on public.profiles for select to authenticated
using (id = auth.uid() or public.has_role(auth.uid(), 'manager'));

create policy "profiles_insert_self_attendant"
on public.profiles for insert to authenticated
with check (id = auth.uid() and role = 'attendant' and active = true);

create policy "profiles_update_self_no_role_change"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and active = (select p.active from public.profiles p where p.id = auth.uid())
);

create policy "profiles_update_manager_all"
on public.profiles for update to authenticated
using (public.has_role(auth.uid(), 'manager'))
with check (public.has_role(auth.uid(), 'manager'));

drop policy if exists "auth users customers" on public.customers;
create policy "customers_select_auth" on public.customers for select to authenticated using (true);
create policy "customers_insert_auth" on public.customers for insert to authenticated with check (true);
create policy "customers_update_auth" on public.customers for update to authenticated using (true) with check (true);
create policy "customers_delete_manager" on public.customers for delete to authenticated
using (public.has_role(auth.uid(), 'manager'));

drop policy if exists "auth users sessions" on public.sessions;
create policy "sessions_select_auth" on public.sessions for select to authenticated using (true);
create policy "sessions_insert_own" on public.sessions for insert to authenticated
with check (attendant_id = auth.uid());
create policy "sessions_update_owner_or_manager" on public.sessions for update to authenticated
using (attendant_id = auth.uid() or public.has_role(auth.uid(), 'manager'))
with check (attendant_id = auth.uid() or public.has_role(auth.uid(), 'manager'));
create policy "sessions_delete_manager" on public.sessions for delete to authenticated
using (public.has_role(auth.uid(), 'manager'));

drop policy if exists "auth users promotions" on public.promotions;
create policy "promotions_select_auth" on public.promotions for select to authenticated using (true);
create policy "promotions_write_manager" on public.promotions for all to authenticated
using (public.has_role(auth.uid(), 'manager'))
with check (public.has_role(auth.uid(), 'manager'));

drop policy if exists "auth users equipments" on public.equipments;
create policy "equipments_select_auth" on public.equipments for select to authenticated using (true);
create policy "equipments_update_auth" on public.equipments for update to authenticated using (true) with check (true);
create policy "equipments_insert_manager" on public.equipments for insert to authenticated
with check (public.has_role(auth.uid(), 'manager'));
create policy "equipments_delete_manager" on public.equipments for delete to authenticated
using (public.has_role(auth.uid(), 'manager'));
