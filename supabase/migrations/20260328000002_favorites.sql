-- Favourites on user list entries (max 10 enforced in app + trigger)

alter table public.user_games
  add column if not exists is_favorite boolean not null default false;

create index if not exists user_games_favorites_idx
  on public.user_games (user_id)
  where is_favorite = true;

create or replace function public.enforce_favorite_limit()
returns trigger
language plpgsql
as $$
declare
  fav_count int;
begin
  if new.is_favorite is true then
    select count(*) into fav_count
    from public.user_games
    where user_id = new.user_id
      and is_favorite = true
      and id is distinct from new.id;

    if fav_count >= 10 then
      raise exception 'You can favourite at most 10 games';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_favorite_limit on public.user_games;
create trigger trg_enforce_favorite_limit
  before insert or update of is_favorite on public.user_games
  for each row
  execute function public.enforce_favorite_limit();
