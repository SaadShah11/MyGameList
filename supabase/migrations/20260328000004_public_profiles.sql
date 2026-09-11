-- Public profile + list for /users/:username (no private notes)

create or replace function public.get_public_profile(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  list_count bigint,
  favorite_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.created_at,
    (select count(*)::bigint from public.user_games ug where ug.user_id = p.id) as list_count,
    (
      select count(*)::bigint
      from public.user_games ug
      where ug.user_id = p.id and ug.is_favorite = true
    ) as favorite_count
  from public.profiles p
  where lower(p.username) = lower(btrim(p_username))
  limit 1;
$$;

create or replace function public.get_public_user_list(p_username text)
returns table (
  id uuid,
  igdb_id bigint,
  status text,
  score numeric,
  hours_played numeric,
  is_favorite boolean,
  updated_at timestamptz,
  game_name text,
  game_slug text,
  cover_url text,
  release_year integer,
  platforms jsonb,
  genres jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ug.id,
    ug.igdb_id,
    ug.status::text,
    ug.score,
    ug.hours_played,
    ug.is_favorite,
    ug.updated_at,
    g.name as game_name,
    g.slug as game_slug,
    g.cover_url,
    g.release_year,
    coalesce(g.platforms, '[]'::jsonb) as platforms,
    coalesce(g.genres, '[]'::jsonb) as genres
  from public.profiles p
  join public.user_games ug on ug.user_id = p.id
  left join public.games g on g.igdb_id = ug.igdb_id
  where lower(p.username) = lower(btrim(p_username))
  order by ug.updated_at desc;
$$;

revoke all on function public.get_public_profile(text) from public;
revoke all on function public.get_public_user_list(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.get_public_user_list(text) to anon, authenticated;
