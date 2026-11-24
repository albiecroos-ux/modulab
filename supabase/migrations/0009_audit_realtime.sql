-- 0009_audit_realtime.sql
-- Audit logs, admin_delete_user RPC, dan publication profiles untuk Realtime.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_id uuid,
  target_email text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
grant select on public.audit_logs to authenticated;
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs for select to authenticated
  using ((select public.is_admin()));
-- tanpa policy insert: hanya ditulis trigger dan fungsi security definer

create or replace function public.log_role_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs (actor_id, action, target_id, target_email, detail)
  values ((select auth.uid()), 'role_changed', new.id, new.email,
          jsonb_build_object('from', old.role, 'to', new.role, 'reason', new.rejection_reason));
  return new;
end;
$$;
revoke all on function public.log_role_change() from public, anon, authenticated;

drop trigger if exists trg_profiles_audit on public.profiles;
create trigger trg_profiles_audit after update of role on public.profiles
  for each row when (old.role is distinct from new.role)
  execute function public.log_role_change();

-- Hapus akun oleh admin (tanpa service_role di frontend)
create or replace function public.admin_delete_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin';
  end if;
  if exists (select 1 from public.profiles where id = p_user_id and role = 'admin') then
    raise exception 'Akun admin tidak boleh dihapus';
  end if;
  insert into public.audit_logs (actor_id, action, target_id, target_email)
    select (select auth.uid()), 'user_deleted', id, email
    from public.profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- Realtime untuk antrian pendaftar dan status ACC
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public'
                   and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

