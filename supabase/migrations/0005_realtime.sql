-- 0005_realtime.sql
-- Aktifkan Realtime untuk tabel konten (idempoten).

do $$
declare
    t text;
begin
    foreach t in array array[
        'modules',
        'module_steps',
        'module_attachments',
        'troubleshooting_cases',
        'glossary_terms',
        'checklist_items',
        'eval_logs'
    ]
    loop
        if not exists (
            select 1
            from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = t
        ) then
            execute format('alter publication supabase_realtime add table public.%I', t);
        end if;
    end loop;
end;
$$;
