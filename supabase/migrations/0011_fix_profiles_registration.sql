-- 0011_fix_profiles_registration.sql
-- Menjamin kolom profil, trigger pendaftaran baru, dan izin insert aman.

-- 1. Tambahkan kolom yang diperlukan jika belum ada
alter table public.profiles
  add column if not exists full_name text not null default '',
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text not null default '';

-- 2. Pastikan role check constraint mendukung alur baru
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'user' where role = 'member';
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'user', 'pending', 'rejected'));

-- 3. Trigger otomatis saat user mendaftar di auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_role text := case
    when lower(coalesce(new.email, '')) = 'adminmodullab@ui.ac.id' then 'admin'
    else 'pending'
  end;
  v_name text := coalesce(new.raw_user_meta_data ->> 'full_name', '');
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, v_email, v_role, v_name)
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end;
  return new;
exception
  when undefined_column then
    -- Fallback jika kolom full_name belum terbaca
    insert into public.profiles (id, email, role)
    values (new.id, v_email, v_role)
    on conflict (id) do update set email = excluded.email;
    return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Izin & RLS agar authenticated user bisa menyisipkan profil miliknya sendiri (safety fallback)
grant insert on public.profiles to authenticated;

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

-- 5. Tambahkan publikasi realtime untuk profiles jika belum
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
