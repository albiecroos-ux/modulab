-- ============================================================================
-- MODULAB: SETUP LENGKAP DATABASE SUPABASE (PROJECT BARU)
-- Salin dan jalankan seluruh isi file ini di Supabase SQL Editor.
-- ============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 2. TABEL PROFILES & ALLOWED_EMAILS
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('admin', 'user', 'pending', 'rejected')),
  full_name text not null default '',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Batasi hanya satu admin utama
create unique index if not exists profiles_single_admin
  on public.profiles ((true)) where role = 'admin';

create table if not exists public.allowed_emails (
  email text primary key,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

-- 3. TABEL KONTEN LABORATORIUM
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_steps (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  step_number int not null,
  instruction text not null,
  safety_note text not null default '',
  media_url text not null default '',
  media_type text not null default '',
  media_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_steps_order_unique unique(module_id, step_number)
);

create table if not exists public.module_attachments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  file_url text not null,
  file_type text not null default '',
  file_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.troubleshooting_items (
  id uuid primary key default gen_random_uuid(),
  problem text not null,
  cause text not null default '',
  solution text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  media_url text not null default '',
  media_type text not null default '',
  media_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  explanation text not null,
  analogy text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  checked boolean not null default false,
  checked_by uuid references public.profiles(id) on delete set null,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evaluation_logs (
  id uuid primary key default gen_random_uuid(),
  score int not null default 0,
  feedback text not null default '',
  author_id uuid references public.profiles(id) on delete set null,
  media_url text not null default '',
  media_type text not null default '',
  media_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 4. FUNGSI KEAMANAN & HELPER
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'user')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- Trigger pendaftaran baru otomatis
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
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
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger penjaga update profil & audit role
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

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.log_role_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs (actor_id, target_id, action, details)
  values (
    (select auth.uid()),
    new.id,
    'change_role',
    jsonb_build_object('old_role', old.role, 'new_role', new.role, 'reason', new.rejection_reason)
  );
  return new;
end;
$$;

drop trigger if exists trg_profiles_audit on public.profiles;
create trigger trg_profiles_audit after update of role on public.profiles
  for each row when (old.role is distinct from new.role)
  execute function public.log_role_change();

-- Fungsi hapus user oleh admin
create or replace function public.admin_delete_user(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Hanya admin yang dapat menghapus akun.';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'Admin tidak dapat menghapus akunnya sendiri.';
  end if;

  insert into public.audit_logs (actor_id, target_id, action, details)
  values ((select auth.uid()), p_user_id, 'delete_user', jsonb_build_object('deleted_at', now()));

  delete from auth.users where id = p_user_id;
  delete from public.profiles where id = p_user_id;
  return true;
end;
$$;

-- 5. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.modules enable row level security;
alter table public.module_steps enable row level security;
alter table public.module_attachments enable row level security;
alter table public.troubleshooting_items enable row level security;
alter table public.glossary_terms enable row level security;
alter table public.checklist_items enable row level security;
alter table public.evaluation_logs enable row level security;
alter table public.audit_logs enable row level security;

-- Hak akses role authenticated
grant select, update, insert on public.profiles to authenticated;
grant select, insert, update, delete on public.allowed_emails to authenticated;
grant select, insert, update, delete on public.modules to authenticated;
grant select, insert, update, delete on public.module_steps to authenticated;
grant select, insert, update, delete on public.module_attachments to authenticated;
grant select, insert, update, delete on public.troubleshooting_items to authenticated;
grant select, insert, update, delete on public.glossary_terms to authenticated;
grant select, insert, update, delete on public.checklist_items to authenticated;
grant select, insert, update, delete on public.evaluation_logs to authenticated;
grant select on public.audit_logs to authenticated;

-- Policies: PROFILES
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Policies: KONTEN (Read untuk admin & user, Tulis hanya admin)
-- Modules
drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules for select to authenticated using ((select public.is_member()));
drop policy if exists modules_write on public.modules;
create policy modules_write on public.modules for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Module Steps
drop policy if exists module_steps_select on public.module_steps;
create policy module_steps_select on public.module_steps for select to authenticated using ((select public.is_member()));
drop policy if exists module_steps_write on public.module_steps;
create policy module_steps_write on public.module_steps for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Module Attachments
drop policy if exists module_attachments_select on public.module_attachments;
create policy module_attachments_select on public.module_attachments for select to authenticated using ((select public.is_member()));
drop policy if exists module_attachments_write on public.module_attachments;
create policy module_attachments_write on public.module_attachments for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Troubleshooting
drop policy if exists trouble_select on public.troubleshooting_items;
create policy trouble_select on public.troubleshooting_items for select to authenticated using ((select public.is_member()));
drop policy if exists trouble_write on public.troubleshooting_items;
create policy trouble_write on public.troubleshooting_items for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Glossary
drop policy if exists glossary_select on public.glossary_terms;
create policy glossary_select on public.glossary_terms for select to authenticated using ((select public.is_member()));
drop policy if exists glossary_write on public.glossary_terms;
create policy glossary_write on public.glossary_terms for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Checklist (user boleh toggle)
drop policy if exists checklist_select on public.checklist_items;
create policy checklist_select on public.checklist_items for select to authenticated using ((select public.is_member()));
drop policy if exists checklist_update on public.checklist_items;
create policy checklist_update on public.checklist_items for update to authenticated using ((select public.is_member()));
drop policy if exists checklist_admin on public.checklist_items;
create policy checklist_admin on public.checklist_items for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Evaluation
drop policy if exists eval_select on public.evaluation_logs;
create policy eval_select on public.evaluation_logs for select to authenticated using ((select public.is_member()));
drop policy if exists eval_insert on public.evaluation_logs;
create policy eval_insert on public.evaluation_logs for insert to authenticated with check ((select public.is_member()));
drop policy if exists eval_admin on public.evaluation_logs;
create policy eval_admin on public.evaluation_logs for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Audit logs
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select to authenticated using ((select public.is_admin()));

-- 6. STORAGE BUCKET: lab-media
insert into storage.buckets (id, name, public)
values ('lab-media', 'lab-media', true)
on conflict (id) do update set public = true;

drop policy if exists lab_media_read on storage.objects;
create policy lab_media_read on storage.objects for select
  using (bucket_id = 'lab-media');

drop policy if exists lab_media_admin_write on storage.objects;
create policy lab_media_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'lab-media' and (select public.is_admin()));

drop policy if exists lab_media_admin_update on storage.objects;
create policy lab_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'lab-media' and (select public.is_admin()));

drop policy if exists lab_media_admin_delete on storage.objects;
create policy lab_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'lab-media' and (select public.is_admin()));

-- 7. REALTIME
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.modules;
alter publication supabase_realtime add table public.module_steps;
alter publication supabase_realtime add table public.module_attachments;
alter publication supabase_realtime add table public.troubleshooting_items;
alter publication supabase_realtime add table public.glossary_terms;
alter publication supabase_realtime add table public.checklist_items;
alter publication supabase_realtime add table public.evaluation_logs;
