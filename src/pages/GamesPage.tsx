import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GameCard } from '../components/GameCard'
import { SearchBar } from '../components/SearchBar'
import { getPopularGames, searchGames } from '../lib/gamesApi'
import { useAuth } from '../context/AuthContext'
import type { Game } from '../types'

export function GamesPage() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const { configured } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!configured) {
        setGames([])
        setLoading(false)
        setError('Configure Supabase and deploy the rawg-proxy function to load games.')
        return
      }
      setLoading(true)
      setError(null)
      try {
        const results = query ? await searchGames(query) : await getPopularGames()
        if (!cancelled) setGames(results)
      } catch (err) {
        if (!cancelled) {
          setGames([])
          setError(err instanceof Error ? err.message : 'Failed to load games')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [query, configured])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-display text-4xl tracking-wide text-cream">
          {query ? `Results for “${query}”` : 'Games library'}
        </h1>
        <p className="text-muted">
          {query
            ? 'Search powered by RAWG via a secure Edge Function.'
            : 'Popular titles from RAWG. Search to find anything in the catalog.'}
        </p>
        <SearchBar initialQuery={query} className="max-w-xl" />
      </div>

      {loading && <p className="text-muted">Loading games…</p>}
      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {!loading && !error && games.length === 0 && (
        <p className="text-muted">No games found. Try another search.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {games.map((game, i) => (
          <GameCard key={game.igdb_id} game={game} index={i} />
        ))}
      </div>
    </div>
  )
}
