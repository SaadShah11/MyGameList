import { isSupabaseConfigured, supabase } from './supabase'
import type { Game } from '../types'

interface ProxyResponse {
  games?: Game[]
  game?: Game
  count?: number
  page?: number
  page_size?: number
  error?: string
}

export interface GamesPageResult {
  games: Game[]
  count: number
  page: number
  pageSize: number
}

async function invokeProxy(body: Record<string, unknown>): Promise<ProxyResponse> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and add your project keys.',
    )
  }

  const { data, error } = await supabase.functions.invoke('rawg-proxy', {
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (error) {
    const details =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error: string }).error)
        : error.message
    throw new Error(details || 'RAWG proxy request failed')
  }

  const payload = data as ProxyResponse
  if (payload?.error) {
    throw new Error(payload.error)
  }

  return payload
}

function toPageResult(
  result: ProxyResponse,
  page: number,
  pageSize: number,
): GamesPageResult {
  const games = result.games ?? []
  return {
    games,
    count: typeof result.count === 'number' ? result.count : games.length,
    page: result.page ?? page,
    pageSize: result.page_size ?? pageSize,
  }
}

export async function searchGames(
  query: string,
  pageSize = 10,
  page = 1,
): Promise<GamesPageResult> {
  const limit = Math.min(Math.max(pageSize, 1), 40)
  const result = await invokeProxy({ action: 'search', query, limit, page })
  return toPageResult(result, page, limit)
}

export async function getPopularGames(
  pageSize = 10,
  page = 1,
): Promise<GamesPageResult> {
  const limit = Math.min(Math.max(pageSize, 1), 40)
  const result = await invokeProxy({ action: 'popular', limit, page })
  return toPageResult(result, page, limit)
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const result = await invokeProxy({ action: 'get_by_slug', slug })
  return result.game ?? null
}

export async function getGameById(externalId: number): Promise<Game | null> {
  const result = await invokeProxy({ action: 'get_by_id', igdb_id: externalId })
  return result.game ?? null
}
