-- 0004_storage.sql
-- Bucket privat lab-media + policy Storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'lab-media',
    'lab-media',
    false,
    10485760, -- 10 MB
    array[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/vnd.rar',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/x-python',
        'text/x-php',
        'application/x-httpd-php',
        'application/sql',
        'application/octet-stream'
    ]
)
on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

--alter table storage.objects enable row level security;

drop policy if exists lab_media_member_select on storage.objects;
create policy lab_media_member_select
    on storage.objects for select
    to authenticated
    using (bucket_id = 'lab-media' and public.is_member());

drop policy if exists lab_media_member_insert_own on storage.objects;
create policy lab_media_member_insert_own
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'lab-media'
        and public.is_member()
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );

drop policy if exists lab_media_member_update_own on storage.objects;
create policy lab_media_member_update_own
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'lab-media'
        and public.is_member()
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    )
    with check (
        bucket_id = 'lab-media'
        and public.is_member()
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );

drop policy if exists lab_media_member_delete_own_or_admin on storage.objects;
create policy lab_media_member_delete_own_or_admin
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'lab-media'
        and public.is_member()
        and (
            (storage.foldername(name))[1] = (select auth.uid()::text)
            or public.is_admin()
        )
    );
