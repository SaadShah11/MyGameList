-- Public user directory: searchable profiles + recent activity (no private notes)

create or replace function public.get_directory_users(
  search_query text default null,
  result_limit integer default 10
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  list_count bigint,
  last_active_at timestamptz,
  recent_game_name text,
  recent_game_slug text,
  recent_game_cover text,
  recent_status text
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_url,
      p.created_at,
      (
        select count(*)::bigint
        from public.user_games ug
        where ug.user_id = p.id
      ) as list_count,
      la.updated_at as last_active_at,
      la.game_name as recent_game_name,
      la.game_slug as recent_game_slug,
      la.cover_url as recent_game_cover,
      la.status::text as recent_status
    from public.profiles p
    left join lateral (
      select
        ug.updated_at,
        ug.status,
        g.name as game_name,
        g.slug as game_slug,
        g.cover_url
      from public.user_games ug
      left join public.games g on g.igdb_id = ug.igdb_id
      where ug.user_id = p.id
      order by ug.updated_at desc
      limit 1
    ) la on true
    where
      search_query is null
      or btrim(search_query) = ''
      or p.username ilike '%' || btrim(search_query) || '%'
      or coalesce(p.display_name, '') ilike '%' || btrim(search_query) || '%'
  )
  select *
  from ranked
  order by coalesce(last_active_at, created_at) desc nulls last
  limit greatest(1, least(coalesce(result_limit, 10), 50));
$$;

revoke all on function public.get_directory_users(text, integer) from public;
grant execute on function public.get_directory_users(text, integer) to anon, authenticated;

-- Allow reading public profile fields for directory / future profile pages
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);
