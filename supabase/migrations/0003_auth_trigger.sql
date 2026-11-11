-- 0003_auth_trigger.sql
-- Profil otomatis saat pendaftaran; role diambil dari allowed_emails.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_role text;
    v_email text := lower(coalesce(new.email, ''));
begin
    select a.role into v_role
    from public.allowed_emails a
    where a.email = v_email
    limit 1;

    if v_role is null then
        v_role := 'pending';
    end if;

    insert into public.profiles (id, email, role)
    values (new.id, v_email, v_role)
    on conflict (id) do update
        set email = excluded.email;

    return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Ketika admin menambahkan/mengubah allowed_emails, profil yang sudah ada
-- (mis. masih pending) langsung diselaraskan.
create or replace function public.sync_allowed_email_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.profiles
       set role = new.role
     where email = lower(new.email)
       and role <> new.role;
    return new;
end;
$$;

revoke all on function public.sync_allowed_email_role() from public;
revoke all on function public.sync_allowed_email_role() from anon, authenticated;

drop trigger if exists on_allowed_email_changed on public.allowed_emails;
create trigger on_allowed_email_changed
    after insert or update on public.allowed_emails
    for each row execute function public.sync_allowed_email_role();

-- Kembalikan akun menjadi pending bila emailnya dihapus dari allowed_emails.
create or replace function public.demote_removed_allowed_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.profiles
       set role = 'pending'
     where email = lower(old.email)
       and role <> 'pending';
    return old;
end;
$$;

revoke all on function public.demote_removed_allowed_email() from public;
revoke all on function public.demote_removed_allowed_email() from anon, authenticated;

drop trigger if exists on_allowed_email_removed on public.allowed_emails;
create trigger on_allowed_email_removed
    after delete on public.allowed_emails
    for each row execute function public.demote_removed_allowed_email();
