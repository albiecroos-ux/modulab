-- 0008_rls_readonly.sql
-- Hak akses read-only untuk user dan tulis hanya untuk admin.

create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin','user')
  );
$$;
revoke all on function public.is_approved() from public, anon;
grant execute on function public.is_approved() to authenticated;

-- Tabel konten: baca untuk admin+user, tulis hanya admin
do $$
declare t text;
begin
  foreach t in array array['modules','module_steps','module_attachments',
    'troubleshooting_cases','glossary_terms','checklist_items','eval_logs'] loop
    execute format('drop policy if exists %I on public.%I', t || '_member_all', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_approved', t);
    execute format('drop policy if exists %I on public.%I', t || '_write_admin', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select public.is_approved()))', t || '_select_approved', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t || '_write_admin', t);
  end loop;
end $$;

-- Storage lab-media: baca admin+user, tulis hanya admin
drop policy if exists lab_media_member_select on storage.objects;
drop policy if exists lab_media_member_insert_own on storage.objects;
drop policy if exists lab_media_member_update_own on storage.objects;
drop policy if exists lab_media_member_delete_own_or_admin on storage.objects;
drop policy if exists lab_media_approved_select on storage.objects;
drop policy if exists lab_media_admin_insert on storage.objects;
drop policy if exists lab_media_admin_update on storage.objects;
drop policy if exists lab_media_admin_delete on storage.objects;

create policy lab_media_approved_select on storage.objects for select to authenticated
  using (bucket_id = 'lab-media' and (select public.is_approved()));
create policy lab_media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'lab-media' and (select public.is_admin())
              and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy lab_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'lab-media' and (select public.is_admin()))
  with check (bucket_id = 'lab-media' and (select public.is_admin()));
create policy lab_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'lab-media' and (select public.is_admin()));

