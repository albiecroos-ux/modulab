-- 0007_roles_approval.sql
-- Penyesuaian role (admin, user, pending, rejected) dan alur persetujuan admin.

-- 1) Role baru: admin | user | pending | rejected
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'user' where role = 'member';
update public.profiles set role = 'user'
 where role = 'admin' and email <> 'adminmodullab@ui.ac.id';
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin','user','pending','rejected'));

alter table public.profiles
  add column if not exists full_name text not null default '',
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text not null default '';

-- 2) Satu admin saja, hanya email ini
alter table public.profiles drop constraint if exists profiles_admin_email_only;
alter table public.profiles
  add constraint profiles_admin_email_only
  check (role <> 'admin' or email = 'adminmodullab@ui.ac.id');
create unique index if not exists profiles_single_admin
  on public.profiles ((true)) where role = 'admin';

-- 3) Pendaftaran baru: pending, kecuali email admin tetap
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_role  text := case when lower(coalesce(new.email, '')) = 'adminmodullab@ui.ac.id'
                       then 'admin' else 'pending' end;
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, v_email, v_role, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- 4) Matikan jalur allowlist lama (tabel allowed_emails tetap ada, deprecated)
drop trigger if exists on_allowed_email_changed on public.allowed_emails;
drop trigger if exists on_allowed_email_removed on public.allowed_emails;

-- 5) Penjaga update profil
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.id <> old.id or new.email <> old.email then
    raise exception 'id dan email profil tidak boleh diubah';
  end if;
  if old.role = 'admin' and new.role <> 'admin' then
    raise exception 'role admin tidak boleh diubah';
  end if;
  if new.role is distinct from old.role then
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;
revoke all on function public.guard_profile_update() from public, anon, authenticated;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

