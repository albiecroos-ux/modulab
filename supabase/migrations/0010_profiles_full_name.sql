-- Pastikan kolom nama profil tersedia untuk query dan trigger pendaftaran.
alter table public.profiles
  add column if not exists full_name text not null default '',
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text not null default '';

update public.profiles p
set full_name = coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
where p.id = u.id
  and p.full_name = '';

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
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    v_email,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;
