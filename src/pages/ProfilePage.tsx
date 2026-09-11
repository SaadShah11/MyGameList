import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { GameCard } from '../components/GameCard'
import { ScoreSelect } from '../components/ScoreSelect'
import { StatusSelect } from '../components/StatusSelect'
import { ViewToggle } from '../components/ViewToggle'
import { useAuth } from '../context/AuthContext'
import {
  gridColsClass,
  usePreferences,
  type ListSort,
} from '../context/PreferencesContext'
import {
  getUserGames,
  removeUserGame,
  updateUserGameFields,
} from '../lib/userGames'
import {
  GAME_STATUSES,
  MAX_FAVORITES,
  STATUS_LABELS,
  type GameStatus,
  type UserGame,
} from '../types'

type TabFilter = 'all' | 'favorites' | GameStatus

function sortEntries(entries: UserGame[], sort: ListSort): UserGame[] {
  const copy = [...entries]
  switch (sort) {
    case 'name':
      copy.sort((a, b) => (a.games?.name ?? '').localeCompare(b.games?.name ?? ''))
      break
    case 'score':
      copy.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
      break
    case 'status':
      copy.sort((a, b) => a.status.localeCompare(b.status))
      break
    default:
      copy.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
  }
  return copy
}

export function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { prefs, setPref } = usePreferences()
  const [entries, setEntries] = useState<UserGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getUserGames(user!.id)
        if (!cancelled) setEntries(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load list')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  const favoriteCount = useMemo(
    () => entries.filter((e) => e.is_favorite).length,
    [entries],
  )

  const counts = useMemo(() => {
    const map: Record<TabFilter, number> = {
      all: entries.length,
      favorites: favoriteCount,
      playing: 0,
      completed: 0,
      on_hold: 0,
      dropped: 0,
      plan_to_play: 0,
    }
    for (const e of entries) map[e.status] += 1
    return map
  }, [entries, favoriteCount])

  const filtered = useMemo(() => {
    const base =
      tab === 'all'
        ? entries
        : tab === 'favorites'
          ? entries.filter((e) => e.is_favorite)
          : entries.filter((e) => e.status === tab)
    return sortEntries(base, prefs.listSort)
  }, [entries, tab, prefs.listSort])

  if (authLoading) return <p className="text-muted">Loading…</p>
  if (!user) return <Navigate to="/login" replace />

  async function patchEntry(
    id: string,
    fields: Partial<{
      status: GameStatus
      score: number | null
      hours_played: number | null
      is_favorite: boolean
    }>,
  ) {
    setBusyId(id)
    setError(null)
    try {
      if (fields.is_favorite === true) {
        const entry = entries.find((e) => e.id === id)
        const others = favoriteCount - (entry?.is_favorite ? 1 : 0)
        if (others >= MAX_FAVORITES) {
          throw new Error(`You can favourite at most ${MAX_FAVORITES} games`)
        }
      }
      const updated = await updateUserGameFields(id, fields)
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  async function onRemove(id: string) {
    setBusyId(id)
    try {
      await removeUserGame(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setBusyId(null)
    }
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: 'Favourites' },
    ...GAME_STATUSES.map((s) => ({ key: s as TabFilter, label: STATUS_LABELS[s] })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink md:text-4xl">
            {profile?.display_name || profile?.username || 'My'} List
          </h1>
          <p className="mt-1 text-muted">
            @{profile?.username ?? 'player'} · {entries.length} game
            {entries.length === 1 ? '' : 's'} · {favoriteCount}/{MAX_FAVORITES} favourites ·{' '}
            <Link to="/settings" className="font-semibold text-accent hover:underline">
              Settings
            </Link>
          </p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
            <span className="ml-1 text-muted">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {loading ? 'Loading…' : `${filtered.length} shown`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort
            <select
              className="field !w-auto !py-1.5"
              value={prefs.listSort}
              onChange={(e) => setPref('listSort', e.target.value as ListSort)}
            >
              <option value="updated">Updated</option>
              <option value="name">Name</option>
              <option value="score">Score</option>
              <option value="status">Status</option>
            </select>
          </label>
          <ViewToggle value={prefs.listView} onChange={(mode) => setPref('listView', mode)} />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="panel border-dashed p-8 text-center text-muted">
          <p>
            {tab === 'favorites'
              ? 'No favourites yet. Mark up to 10 games from your list.'
              : 'No games in this status yet.'}
          </p>
          <Link to="/games" className="mt-2 inline-block font-semibold text-accent hover:underline">
            Browse the library
          </Link>
        </div>
      )}

      {prefs.listView === 'grid' ? (
        <div className={gridColsClass(prefs.gridDensity)}>
          {filtered.map((entry, i) =>
            entry.games ? (
              <GameCard
                key={entry.id}
                game={entry.games}
                index={i}
                metaRight={
                  <span className="flex flex-col items-end gap-0.5 text-xs font-bold">
                    {entry.is_favorite && <span className="text-accent">Fav</span>}
                    {entry.score != null && <span className="text-accent">{entry.score}</span>}
                  </span>
                }
              />
            ) : null,
          )}
        </div>
      ) : (
        <div className="panel divide-y divide-line overflow-hidden">
          {filtered.map((entry) => {
            const game = entry.games
            return (
              <article
                key={entry.id}
                className="grid gap-3 p-3 sm:grid-cols-[64px_1fr_auto] sm:items-center"
              >
                <Link
                  to={game ? `/games/${game.slug}` : '/games'}
                  className="overflow-hidden rounded border border-line bg-surface-2"
                >
                  {game?.cover_url ? (
                    <img
                      src={game.cover_url}
                      alt=""
                      className="aspect-[3/4] w-full object-cover sm:h-20 sm:w-auto"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center text-xs text-muted sm:h-20">
                      —
                    </div>
                  )}
                </Link>

                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={game ? `/games/${game.slug}` : '/games'}
                      className="truncate font-semibold text-ink hover:text-accent"
                    >
                      {game?.name ?? `Game #${entry.igdb_id}`}
                    </Link>
                    {entry.is_favorite && (
                      <span className="rounded border border-accent/40 px-1.5 py-0.5 text-[11px] font-bold text-accent">
                        Favourite
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusSelect
                      value={entry.status}
                      onChange={(status) => void patchEntry(entry.id, { status })}
                      className="!w-auto !py-1.5 text-sm"
                    />
                    <label className="flex items-center gap-1 text-sm text-muted">
                      Score
                      <ScoreSelect
                        value={entry.score}
                        disabled={busyId === entry.id}
                        className="!w-auto !min-w-[10rem] !py-1.5 text-sm"
                        onChange={(score) => {
                          if (score !== entry.score) void patchEntry(entry.id, { score })
                        }}
                      />
                    </label>
                    <label className="flex items-center gap-1 text-sm text-muted">
                      Hours
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        disabled={busyId === entry.id}
                        defaultValue={entry.hours_played ?? ''}
                        onBlur={(e) => {
                          const v = e.target.value
                          const hours_played = v === '' ? null : Number(v)
                          if (hours_played !== entry.hours_played) {
                            void patchEntry(entry.id, { hours_played })
                          }
                        }}
                        className="field !w-20 !py-1"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busyId === entry.id}
                      className={`btn !py-1.5 text-sm ${
                        entry.is_favorite ? 'btn-primary' : 'btn-ghost'
                      }`}
                      onClick={() =>
                        void patchEntry(entry.id, { is_favorite: !entry.is_favorite })
                      }
                    >
                      {entry.is_favorite ? 'Unfavourite' : 'Favourite'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busyId === entry.id}
                  onClick={() => void onRemove(entry.id)}
                  className="btn btn-danger !py-1.5 self-start sm:self-center"
                >
                  Remove
                </button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
