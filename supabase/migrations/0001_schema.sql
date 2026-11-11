-- 0001_schema.sql
-- Skema inti LabAssist. Jalankan di Supabase SQL Editor (atau `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: satu baris per auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    role text not null default 'pending' check (role in ('admin', 'member', 'pending')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- allowed_emails: daftar email yang boleh menjadi member/admin
-- ---------------------------------------------------------------------------
create table if not exists public.allowed_emails (
    email text primary key check (email = lower(email)),
    role text not null default 'member' check (role in ('admin', 'member')),
    created_at timestamptz not null default now(),
    created_by uuid references public.profiles (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Konten
-- ---------------------------------------------------------------------------
create table if not exists public.modules (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    title text not null default '',
    duration text not null default '',
    goal text not null default '',
    tools text not null default '',
    created_by uuid references public.profiles (id) on delete set null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists modules_legacy_id_key
    on public.modules (legacy_id) where legacy_id is not null;

drop trigger if exists trg_modules_updated_at on public.modules;
create trigger trg_modules_updated_at
    before update on public.modules
    for each row execute function public.set_updated_at();

create table if not exists public.module_steps (
    id uuid primary key default gen_random_uuid(),
    module_id uuid not null references public.modules (id) on delete cascade,
    position integer not null default 0,
    instruction text not null default '',
    tip text not null default '',
    media_name text not null default '',
    media_type text check (media_type is null or media_type in ('image', 'video', 'pdf', 'youtube', 'link', 'file')),
    media_url text not null default '',
    created_by uuid references public.profiles (id) on delete set null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists module_steps_module_id_position_idx
    on public.module_steps (module_id, position);

drop trigger if exists trg_module_steps_updated_at on public.module_steps;
create trigger trg_module_steps_updated_at
    before update on public.module_steps
    for each row execute function public.set_updated_at();

create table if not exists public.module_attachments (
    id uuid primary key default gen_random_uuid(),
    module_id uuid not null references public.modules (id) on delete cascade,
    position integer not null default 0,
    name text not null default '',
    type text not null default 'file' check (type in ('image', 'video', 'pdf', 'youtube', 'link', 'file')),
    url text not null default '',
    size text not null default '',
    created_by uuid references public.profiles (id) on delete set null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists module_attachments_module_id_position_idx
    on public.module_attachments (module_id, position);

drop trigger if exists trg_module_attachments_updated_at on public.module_attachments;
create trigger trg_module_attachments_updated_at
    before update on public.module_attachments
    for each row execute function public.set_updated_at();

create table if not exists public.troubleshooting_cases (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    category text not null default '',
    symptom text not null default '',
    cause text not null default '',
    solution text not null default '',
    media_name text not null default '',
    media_type text check (media_type is null or media_type in ('image', 'video', 'pdf', 'youtube', 'link', 'file')),
    media_url text not null default '',
    created_by uuid references public.profiles (id) on delete set null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists troubleshooting_cases_legacy_id_key
    on public.troubleshooting_cases (legacy_id) where legacy_id is not null;

drop trigger if exists trg_troubleshooting_cases_updated_at on public.troubleshooting_cases;
create trigger trg_troubleshooting_cases_updated_at
    before update on public.troubleshooting_cases
    for each row execute function public.set_updated_at();

create table if not exists public.glossary_terms (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    term text not null default '',
    def text not null default '',
    analogy text not null default '',
    media_name text not null default '',
    media_type text check (media_type is null or media_type in ('image', 'video', 'pdf', 'youtube', 'link', 'file')),
    media_url text not null default '',
    created_by uuid references public.profiles (id) on delete set null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists glossary_terms_legacy_id_key
    on public.glossary_terms (legacy_id) where legacy_id is not null;

drop trigger if exists trg_glossary_terms_updated_at on public.glossary_terms;
create trigger trg_glossary_terms_updated_at
    before update on public.glossary_terms
    for each row execute function public.set_updated_at();

create table if not exists public.checklist_items (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    text text not null default '',
    checked boolean not null default false,
    position integer not null default 0,
    created_by uuid references public.profiles (id) on delete set null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists checklist_items_legacy_id_key
    on public.checklist_items (legacy_id) where legacy_id is not null;

drop trigger if exists trg_checklist_items_updated_at on public.checklist_items;
create trigger trg_checklist_items_updated_at
    before update on public.checklist_items
    for each row execute function public.set_updated_at();

create table if not exists public.eval_logs (
    id uuid primary key default gen_random_uuid(),
    legacy_id text,
    date text not null default '',
    session text not null default '',
    confused text not null default '',
    action text not null default '',
    media_name text not null default '',
    media_type text check (media_type is null or media_type in ('image', 'video', 'pdf', 'youtube', 'link', 'file')),
    media_url text not null default '',
    created_by uuid references public.profiles (id) on delete set null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists eval_logs_legacy_id_key
    on public.eval_logs (legacy_id) where legacy_id is not null;

drop trigger if exists trg_eval_logs_updated_at on public.eval_logs;
create trigger trg_eval_logs_updated_at
    before update on public.eval_logs
    for each row execute function public.set_updated_at();
