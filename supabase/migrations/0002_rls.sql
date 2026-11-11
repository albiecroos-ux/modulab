-- 0002_rls.sql
-- Access helpers and row-level security policies.

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role in ('admin', 'member')
    );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'admin'
    );
$$;

revoke all on function public.is_member() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_member() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.modules enable row level security;
alter table public.module_steps enable row level security;
alter table public.module_attachments enable row level security;
alter table public.troubleshooting_cases enable row level security;
alter table public.glossary_terms enable row level security;
alter table public.checklist_items enable row level security;
alter table public.eval_logs enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.allowed_emails to authenticated;
grant select, insert, update, delete on public.modules to authenticated;
grant select, insert, update, delete on public.module_steps to authenticated;
grant select, insert, update, delete on public.module_attachments to authenticated;
grant select, insert, update, delete on public.troubleshooting_cases to authenticated;
grant select, insert, update, delete on public.glossary_terms to authenticated;
grant select, insert, update, delete on public.checklist_items to authenticated;
grant select, insert, update, delete on public.eval_logs to authenticated;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
    on public.profiles for select
    to authenticated
    using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
    on public.profiles for update
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists allowed_emails_admin_all on public.allowed_emails;
create policy allowed_emails_admin_all
    on public.allowed_emails for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists modules_member_all on public.modules;
create policy modules_member_all
    on public.modules for all
    to authenticated
    using ((select public.is_member()))
    with check ((select public.is_member()));

drop policy if exists module_steps_member_all on public.module_steps;
create policy module_steps_member_all
    on public.module_steps for all
    to authenticated
    using ((select public.is_member()))
    with check ((select public.is_member()));

drop policy if exists module_attachments_member_all on public.module_attachments;
create policy module_attachments_member_all
    on public.module_attachments for all
    to authenticated
    using ((select public.is_member()))
    with check ((select public.is_member()));

drop policy if exists troubleshooting_cases_member_all on public.troubleshooting_cases;
create policy troubleshooting_cases_member_all
    on public.troubleshooting_cases for all
    to authenticated
    using ((select public.is_member()))
    with check ((select public.is_member()));

drop policy if exists glossary_terms_member_all on public.glossary_terms;
create policy glossary_terms_member_all
    on public.glossary_terms for all
    to authenticated
    using ((select public.is_member()))
    with check ((select public.is_member()));

drop policy if exists checklist_items_member_all on public.checklist_items;
create policy checklist_items_member_all
    on public.checklist_items for all
    to authenticated
    using ((select public.is_member()))
    with check ((select public.is_member()));

drop policy if exists eval_logs_member_all on public.eval_logs;
create policy eval_logs_member_all
    on public.eval_logs for all
    to authenticated
    using ((select public.is_member()))
    with check ((select public.is_member()));
