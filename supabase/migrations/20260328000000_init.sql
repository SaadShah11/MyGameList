-- Create profiles, games cache, and user_games with RLS

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,24}$')
);

create table if not exists public.games (
  igdb_id bigint primary key,
  name text not null,
  slug text not null unique,
  cover_url text,
  release_year int,
  platforms jsonb not null default '[]'::jsonb,
  genres jsonb not null default '[]'::jsonb,
  summary text,
  cached_at timestamptz not null default now()
);

create type public.game_status as enum (
  'playing',
  'completed',
  'on_hold',
  'dropped',
  'plan_to_play'
);

create table if not exists public.user_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  igdb_id bigint not null references public.games (igdb_id) on delete cascade,
  status public.game_status not null default 'plan_to_play',
  score numeric(3, 1) check (score is null or (score >= 1 and score <= 10)),
  hours_played numeric(8, 1) check (hours_played is null or hours_played >= 0),
  notes text,
  started_at date,
  finished_at date,
  updated_at timestamptz not null default now(),
  unique (user_id, igdb_id)
);

create index if not exists user_games_user_id_idx on public.user_games (user_id);
create index if not exists user_games_status_idx on public.user_games (user_id, status);
create index if not exists games_name_idx on public.games using gin (to_tsvector('english', name));

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.user_games enable row level security;

-- Profiles: users manage their own row
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Games cache: readable by authenticated users; writes via service role / edge function
create policy "games_select_authenticated"
  on public.games for select
  to authenticated
  using (true);

create policy "games_select_anon"
  on public.games for select
  to anon
  using (true);

-- User games: owner only
create policy "user_games_select_own"
  on public.user_games for select
  using (auth.uid() = user_id);

create policy "user_games_insert_own"
  on public.user_games for insert
  with check (auth.uid() = user_id);

create policy "user_games_update_own"
  on public.user_games for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_games_delete_own"
  on public.user_games for delete
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  uname := regexp_replace(uname, '[^a-z0-9_]', '', 'g');
  if char_length(uname) < 3 then
    uname := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  uname := substr(uname, 1, 24);

  insert into public.profiles (id, username, display_name)
  values (new.id, uname, uname)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
