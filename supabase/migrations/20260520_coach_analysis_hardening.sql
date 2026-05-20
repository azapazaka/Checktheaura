create schema if not exists private;

revoke all on schema private from public;

create or replace function private.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

insert into public.profiles (id)
select auth_users.id
from auth.users as auth_users
left join public.profiles as profiles
  on profiles.id = auth_users.id
where profiles.id is null;

drop trigger if exists on_auth_user_created_checktheaura_profile on auth.users;

create trigger on_auth_user_created_checktheaura_profile
after insert on auth.users
for each row
execute function private.handle_new_profile();

with ranked_analyses as (
  select
    id,
    row_number() over (
      partition by match_id, user_id
      order by updated_at desc, created_at desc, id desc
    ) as duplicate_rank
  from public.coach_analyses
)
delete from public.coach_analyses
where id in (
  select id
  from ranked_analyses
  where duplicate_rank > 1
);

create unique index if not exists coach_analyses_match_user_uidx
on public.coach_analyses (match_id, user_id);
