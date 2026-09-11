-- Track when a game was first added to a user's list

alter table public.user_games
  add column if not exists created_at timestamptz;

update public.user_games
set created_at = coalesce(created_at, updated_at, now())
where created_at is null;

alter table public.user_games
  alter column created_at set default now();

alter table public.user_games
  alter column created_at set not null;
