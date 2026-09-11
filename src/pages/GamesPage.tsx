import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GameCard, GameListRow } from '../components/GameCard'
import { DensityToggle } from '../components/DensityToggle'
import { Pagination } from '../components/Pagination'
import { SearchBar } from '../components/SearchBar'
import { ViewToggle } from '../components/ViewToggle'
import { useAuth } from '../context/AuthContext'
import {
  gridColsClass,
  usePreferences,
  type CatalogSort,
} from '../context/PreferencesContext'
import { usePagination } from '../hooks/usePagination'
import { getPopularGames, searchGames } from '../lib/gamesApi'
import { clampPageSize } from '../lib/pagination'
import { getUserGames, removeUserGame, upsertUserGame } from '../lib/userGames'
import type { Game, GameStatus, UserGame } from '../types'

function sortGames(games: Game[], sort: CatalogSort): Game[] {
  if (sort === 'default') return games
  const copy = [...games]
  if (sort === 'name') {
    copy.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === 'year') {
    copy.sort((a, b) => (b.release_year ?? 0) - (a.release_year ?? 0))
  }
  return copy
}

export function GamesPage() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const { configured, user } = useAuth()
  const { prefs, setPref } = usePreferences()
  const [games, setGames] = useState<Game[]>([])
  const [total, setTotal] = useState(0)
  const [statusById, setStatusById] = useState<Record<number, UserGame>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { page, pageSize, setPage, setPageSize } = usePagination({
    total,
    defaultPageSize: prefs.pageSize,
    resetKey: query,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!configured) {
        setGames([])
        setTotal(0)
        setLoading(false)
        setError('Configure Supabase and deploy the rawg-proxy function to load games.')
        return
      }
      setLoading(true)
      setError(null)
      try {
        const results = query
          ? await searchGames(query, pageSize, page)
          : await getPopularGames(pageSize, page)
        if (!cancelled) {
          setGames(results.games)
          setTotal(results.count)
        }
      } catch (err) {
        if (!cancelled) {
          setGames([])
          setTotal(0)
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
  }, [query, configured, page, pageSize])

  useEffect(() => {
    let cancelled = false
    const userId = user?.id
    async function loadStatuses() {
      if (!userId) {
        setStatusById({})
        return
      }
      try {
        const list = await getUserGames(userId)
        if (cancelled) return
        const map: Record<number, UserGame> = {}
        for (const entry of list) map[entry.igdb_id] = entry
        setStatusById(map)
      } catch {
        if (!cancelled) setStatusById({})
      }
    }
    void loadStatuses()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const sorted = useMemo(
    () => sortGames(games, prefs.catalogSort),
    [games, prefs.catalogSort],
  )

  const onStatusChange = useCallback(
    async (game: Game, status: GameStatus | null) => {
      if (!user) return
      setBusyId(game.igdb_id)
      setError(null)
      try {
        const existing = statusById[game.igdb_id]
        if (status === null) {
          if (existing) {
            await removeUserGame(existing.id)
            setStatusById((prev) => {
              const next = { ...prev }
              delete next[game.igdb_id]
              return next
            })
          }
          return
        }
        const saved = await upsertUserGame(user.id, {
          igdb_id: game.igdb_id,
          status,
          score: existing?.score ?? null,
          hours_played: existing?.hours_played ?? null,
          notes: existing?.notes ?? null,
          is_favorite: existing?.is_favorite ?? false,
        })
        setStatusById((prev) => ({ ...prev, [game.igdb_id]: saved }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status')
      } finally {
        setBusyId(null)
      }
    },
    [user, statusById],
  )

  function onPageSizeChange(size: number) {
    const next = clampPageSize(size)
    setPageSize(next)
    setPref('pageSize', next)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-extrabold text-ink md:text-4xl">
          {query ? `Results for “${query}”` : 'Games'}
        </h1>
        <p className="text-muted">
          {query ? 'Matches from RAWG.' : 'Popular titles. Search to dig into the full catalog.'}
          {user
            ? ' Set a status from the list without opening the page.'
            : (
              <>
                {' '}
                <Link to="/login" className="font-semibold text-accent hover:underline">
                  Log in
                </Link>{' '}
                to set status from results.
              </>
            )}
        </p>
        <SearchBar initialQuery={query} className="max-w-xl" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <p className="text-sm text-muted">
          {loading
            ? 'Loading…'
            : `${total.toLocaleString()} title${total === 1 ? '' : 's'}`}
        </p>
        <div className="relative z-20 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort
            <select
              className="field relative z-20 !w-auto !py-1.5"
              value={prefs.catalogSort}
              onChange={(e) => setPref('catalogSort', e.target.value as CatalogSort)}
            >
              <option value="default">Default</option>
              <option value="name">Name</option>
              <option value="year">Year</option>
            </select>
          </label>
          {prefs.catalogView === 'grid' && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>Density</span>
              <DensityToggle
                value={prefs.gridDensity}
                onChange={(density) => setPref('gridDensity', density)}
              />
            </div>
          )}
          <ViewToggle
            value={prefs.catalogView}
            onChange={(mode) => setPref('catalogView', mode)}
          />
        </div>
      </div>

      {error && (
        <div className="panel border-danger/40 px-4 py-3 text-sm text-danger">{error}</div>
      )}
      {!loading && !error && sorted.length === 0 && (
        <p className="text-muted">No games found. Try another search.</p>
      )}

      {prefs.catalogView === 'grid' ? (
        <div className={gridColsClass(prefs.gridDensity)}>
          {sorted.map((game, i) => (
            <GameCard
              key={game.igdb_id}
              game={game}
              index={i}
              showStatus={Boolean(user)}
              status={statusById[game.igdb_id]?.status ?? null}
              statusDisabled={busyId === game.igdb_id}
              onStatusChange={(status) => void onStatusChange(game, status)}
            />
          ))}
        </div>
      ) : (
        <div className="panel px-4">
          {sorted.map((game) => (
            <GameListRow
              key={game.igdb_id}
              game={game}
              showStatus={Boolean(user)}
              status={statusById[game.igdb_id]?.status ?? null}
              statusDisabled={busyId === game.igdb_id}
              onStatusChange={(status) => void onStatusChange(game, status)}
              trailing={
                <span className="text-xs font-semibold text-muted">
                  {game.release_year ?? 'TBA'}
                </span>
              }
            />
          ))}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="panel overflow-hidden">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  )
}
