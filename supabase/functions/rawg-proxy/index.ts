import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RawgPlatformRef {
  platform?: { name?: string }
}

interface RawgGenre {
  name?: string
}

interface RawgGame {
  id: number
  name: string
  slug: string
  description_raw?: string
  description?: string
  background_image?: string | null
  released?: string | null
  platforms?: RawgPlatformRef[]
  genres?: RawgGenre[]
}

interface NormalizedGame {
  igdb_id: number
  name: string
  slug: string
  cover_url: string | null
  release_year: number | null
  platforms: string[]
  genres: string[]
  summary: string | null
  cached_at: string
}

interface RawgListResponse {
  count?: number
  results?: RawgGame[]
}

function stripHtml(html?: string): string | null {
  if (!html) return null
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text || null
}

function normalize(game: RawgGame): NormalizedGame {
  const year = game.released ? Number(game.released.slice(0, 4)) : null
  return {
    // Column name is historical; value is the RAWG game id
    igdb_id: game.id,
    name: game.name,
    slug: game.slug,
    cover_url: game.background_image ?? null,
    release_year: Number.isFinite(year) ? year : null,
    platforms: (game.platforms ?? [])
      .map((p) => p.platform?.name)
      .filter((n): n is string => Boolean(n)),
    genres: (game.genres ?? [])
      .map((g) => g.name)
      .filter((n): n is string => Boolean(n)),
    summary: game.description_raw ?? stripHtml(game.description),
    cached_at: new Date().toISOString(),
  }
}

async function rawgGet(path: string, apiKey: string, params: Record<string, string> = {}) {
  const url = new URL(`https://api.rawg.io/api${path}`)
  url.searchParams.set('key', apiKey)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`RAWG error ${res.status}: ${text}`)
  }
  return res.json()
}

async function upsertGames(
  supabase: ReturnType<typeof createClient>,
  games: NormalizedGame[],
) {
  if (games.length === 0) return
  const { error } = await supabase.from('games').upsert(games, { onConflict: 'igdb_id' })
  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawgApiKey = Deno.env.get('RAWG_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!rawgApiKey || !supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Server missing RAWG_API_KEY or Supabase secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const payload = await req.json()
    const action = payload.action as string
    const limit = Math.min(Math.max(Number(payload.limit) || 24, 1), 40)
    const page = Math.max(Number(payload.page) || 1, 1)

    const supabase = createClient(supabaseUrl, serviceKey)
    let raw: RawgGame[] = []
    let totalCount: number | null = null

    if (action === 'search') {
      const query = String(payload.query ?? '').trim()
      if (!query) {
        return new Response(JSON.stringify({ games: [], count: 0, page, page_size: limit }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const data = (await rawgGet('/games', rawgApiKey, {
        search: query,
        page: String(page),
        page_size: String(limit),
      })) as RawgListResponse
      raw = data.results ?? []
      totalCount = typeof data.count === 'number' ? data.count : raw.length
    } else if (action === 'popular') {
      const data = (await rawgGet('/games', rawgApiKey, {
        ordering: '-added',
        page: String(page),
        page_size: String(limit),
      })) as RawgListResponse
      raw = data.results ?? []
      totalCount = typeof data.count === 'number' ? data.count : raw.length
    } else if (action === 'get_by_slug') {
      const slug = String(payload.slug ?? '').trim()
      const data = (await rawgGet('/games', rawgApiKey, {
        search: slug,
        page_size: '20',
      })) as RawgListResponse
      const match = (data.results ?? []).find((g) => g.slug === slug)
      if (match) {
        const detail = (await rawgGet(`/games/${match.id}`, rawgApiKey)) as RawgGame
        raw = [detail]
      }
    } else if (action === 'get_by_id') {
      const id = Number(payload.igdb_id)
      const detail = (await rawgGet(`/games/${id}`, rawgApiKey)) as RawgGame
      raw = [detail]
    } else {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const games = raw.map(normalize)
    await upsertGames(supabase, games)

    if (action === 'get_by_slug' || action === 'get_by_id') {
      return new Response(JSON.stringify({ game: games[0] ?? null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        games,
        count: totalCount ?? games.length,
        page,
        page_size: limit,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
