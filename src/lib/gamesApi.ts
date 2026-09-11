import { isSupabaseConfigured, supabase } from './supabase'
import type { Game } from '../types'

interface ProxyResponse {
  games?: Game[]
  game?: Game
  error?: string
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

export async function searchGames(query: string, limit = 24): Promise<Game[]> {
  const result = await invokeProxy({ action: 'search', query, limit })
  return result.games ?? []
}

export async function getPopularGames(limit = 24): Promise<Game[]> {
  const result = await invokeProxy({ action: 'popular', limit })
  return result.games ?? []
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const result = await invokeProxy({ action: 'get_by_slug', slug })
  return result.game ?? null
}

export async function getGameById(externalId: number): Promise<Game | null> {
  const result = await invokeProxy({ action: 'get_by_id', igdb_id: externalId })
  return result.game ?? null
}
