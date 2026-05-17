create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  city text,
  class_id text,
  xp integer not null default 0,
  level integer not null default 1,
  title text not null default 'Новобранец',
  wins integer not null default 0,
  games_played integer not null default 0,
  stats jsonb not null default '{"str":0,"int":0,"agi":0,"lck":0}'::jsonb,
  unspent_stat_points integer not null default 0,
  daily_quests jsonb not null default '{"date":"","completed":{"playMatch":false,"winMedium":false,"crownKing":false}}'::jsonb,
  unlocks jsonb not null default '{"themes":["default"],"difficulties":["easy"]}'::jsonb,
  rank_score integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  outcome text not null check (outcome in ('win', 'loss', 'draw')),
  difficulty text not null,
  xp_earned integer not null default 0,
  used_shadow_hint boolean not null default false,
  summary jsonb not null,
  move_log jsonb not null default '[]'::jsonb,
  result_metadata jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coach_analyses (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null default 0,
  highlights jsonb not null default '[]'::jsonb,
  mistakes jsonb not null default '[]'::jsonb,
  tip text not null default '',
  source text not null check (source in ('live', 'fallback')),
  status text not null check (status in ('pending', 'ready', 'failed')) default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  host_user_id uuid not null references public.profiles (id) on delete cascade,
  guest_user_id uuid references public.profiles (id) on delete set null,
  status text not null check (status in ('waiting', 'active', 'completed')) default 'waiting',
  game_state jsonb not null,
  current_turn text not null check (current_turn in ('white', 'black')) default 'white',
  winner text check (winner in ('white', 'black')),
  last_move_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.room_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  actor_user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in ('join', 'move', 'complete', 'sync')),
  move jsonb,
  snapshot jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_coach_analyses_updated_at on public.coach_analyses;
create trigger touch_coach_analyses_updated_at
before update on public.coach_analyses
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_rooms_updated_at on public.rooms;
create trigger touch_rooms_updated_at
before update on public.rooms
for each row
execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.coach_analyses enable row level security;
alter table public.rooms enable row level security;
alter table public.room_events enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles leaderboard read" on public.profiles;
create policy "profiles leaderboard read"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "matches read own" on public.matches;
create policy "matches read own"
on public.matches
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "matches insert own" on public.matches;
create policy "matches insert own"
on public.matches
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "coach analyses read own" on public.coach_analyses;
create policy "coach analyses read own"
on public.coach_analyses
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "coach analyses insert own" on public.coach_analyses;
create policy "coach analyses insert own"
on public.coach_analyses
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "room members read" on public.rooms;
create policy "room members read"
on public.rooms
for select
to authenticated
using (auth.uid() = host_user_id or auth.uid() = guest_user_id);

drop policy if exists "room host insert" on public.rooms;
create policy "room host insert"
on public.rooms
for insert
to authenticated
with check (auth.uid() = host_user_id);

drop policy if exists "room members update" on public.rooms;
create policy "room members update"
on public.rooms
for update
to authenticated
using (auth.uid() = host_user_id or auth.uid() = guest_user_id)
with check (auth.uid() = host_user_id or auth.uid() = guest_user_id);

drop policy if exists "room event members read" on public.room_events;
create policy "room event members read"
on public.room_events
for select
to authenticated
using (
  exists (
    select 1
    from public.rooms rooms
    where rooms.id = room_events.room_id
      and (auth.uid() = rooms.host_user_id or auth.uid() = rooms.guest_user_id)
  )
);

drop policy if exists "room event members insert" on public.room_events;
create policy "room event members insert"
on public.room_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.rooms rooms
    where rooms.id = room_events.room_id
      and (auth.uid() = rooms.host_user_id or auth.uid() = rooms.guest_user_id)
  )
);

grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.matches to authenticated;
grant select, insert on public.coach_analyses to authenticated;
grant select, insert, update on public.rooms to authenticated;
grant select, insert on public.room_events to authenticated;

create or replace function public.get_leaderboard(city_filter text default null)
returns table (
  user_id uuid,
  rank bigint,
  title text,
  city text,
  wins integer,
  level integer,
  xp integer,
  rank_score integer
)
language sql
security invoker
as $$
  with ranked as (
    select
      profiles.id as user_id,
      profiles.title,
      profiles.city,
      profiles.wins,
      profiles.level,
      profiles.xp,
      profiles.rank_score,
      rank() over (
        order by profiles.rank_score desc, profiles.wins desc, profiles.level desc, profiles.xp desc
      ) as rank
    from public.profiles
    where city_filter is null or profiles.city = city_filter
  )
  select r.user_id, r.rank, r.title, r.city, r.wins, r.level, r.xp, r.rank_score
  from ranked r
  order by r.rank asc
  limit 25;
$$;
