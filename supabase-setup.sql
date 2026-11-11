-- LEGACY: skema satu-blob lama. Tidak dipakai aplikasi baru.
-- Gunakan supabase/migrations/0001_schema.sql .. 0006_seed.sql.
-- Tabel labassist_shared_state di bawah dipertahankan agar fitur impor data
-- lama masih dapat membacanya.

create table if not exists public.labassist_shared_state (
    id smallint primary key check (id = 1),
    state jsonb not null check (jsonb_typeof(state) = 'object'),
    updated_at timestamptz not null default now()
);

alter table public.labassist_shared_state enable row level security;

drop policy if exists "Authenticated users can read shared LabAssist state" on public.labassist_shared_state;
create policy "Authenticated users can read shared LabAssist state"
    on public.labassist_shared_state for select
    to authenticated
    using ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can create shared LabAssist state" on public.labassist_shared_state;
create policy "Authenticated users can create shared LabAssist state"
    on public.labassist_shared_state for insert
    to authenticated
    with check ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can update shared LabAssist state" on public.labassist_shared_state;
create policy "Authenticated users can update shared LabAssist state"
    on public.labassist_shared_state for update
    to authenticated
    using ((select auth.uid()) is not null)
    with check ((select auth.uid()) is not null);

grant select, insert, update on public.labassist_shared_state to authenticated;
