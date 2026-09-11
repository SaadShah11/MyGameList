import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { StatusSelect } from '../components/StatusSelect'
import { useAuth } from '../context/AuthContext'
import {
  getUserGames,
  removeUserGame,
  updateUserGameFields,
} from '../lib/userGames'
import {
  GAME_STATUSES,
  STATUS_LABELS,
  type GameStatus,
  type UserGame,
} from '../types'

type TabFilter = 'all' | GameStatus

export function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth()
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

  const counts = useMemo(() => {
    const map: Record<TabFilter, number> = {
      all: entries.length,
      playing: 0,
      completed: 0,
      on_hold: 0,
      dropped: 0,
      plan_to_play: 0,
    }
    for (const e of entries) map[e.status] += 1
    return map
  }, [entries])

  const filtered = useMemo(
    () => (tab === 'all' ? entries : entries.filter((e) => e.status === tab)),
    [entries, tab],
  )

  if (authLoading) return <p className="text-muted">Loading…</p>
  if (!user) return <Navigate to="/login" replace />

  async function patchEntry(
    id: string,
    fields: Partial<{ status: GameStatus; score: number | null; hours_played: number | null }>,
  ) {
    setBusyId(id)
    try {
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
    ...GAME_STATUSES.map((s) => ({ key: s as TabFilter, label: STATUS_LABELS[s] })),
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-5xl tracking-wide text-cream">
          {profile?.display_name || profile?.username || 'My'} List
        </h1>
        <p className="text-muted">
          @{profile?.username ?? 'player'} · {entries.length} game
          {entries.length === 1 ? '' : 's'} tracked
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === t.key
                ? 'bg-accent font-semibold text-ink'
                : 'text-muted hover:bg-panel hover:text-cream'
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {loading && <p className="text-muted">Loading your list…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-line p-8 text-center text-muted">
          <p>No games in this status yet.</p>
          <Link to="/games" className="mt-2 inline-block text-accent hover:underline">
            Browse the library
          </Link>
        </div>
      )}

      <div className="animate-tab space-y-3" key={tab}>
        {filtered.map((entry) => {
          const game = entry.games
          return (
            <article
              key={entry.id}
              className="grid gap-4 rounded-lg border border-line bg-panel/50 p-3 sm:grid-cols-[72px_1fr_auto]"
            >
              <Link to={game ? `/games/${game.slug}` : '/games'} className="block overflow-hidden rounded bg-ink-soft">
                {game?.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={game.name}
                    className="aspect-[3/4] h-full w-full object-cover sm:h-[96px]"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center text-xs text-muted sm:h-[96px]">
                    —
                  </div>
                )}
              </Link>

              <div className="min-w-0 space-y-2">
                <Link
                  to={game ? `/games/${game.slug}` : '/games'}
                  className="block truncate font-semibold text-cream hover:text-accent"
                >
                  {game?.name ?? `Game #${entry.igdb_id}`}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusSelect
                    value={entry.status}
                    onChange={(status) => void patchEntry(entry.id, { status })}
                    className="text-sm"
                  />
                  <label className="flex items-center gap-1 text-sm text-muted">
                    Score
                    <input
                      type="number"
                      min={1}
                      max={10}
                      step={0.5}
                      disabled={busyId === entry.id}
                      defaultValue={entry.score ?? ''}
                      onBlur={(e) => {
                        const v = e.target.value
                        const score = v === '' ? null : Number(v)
                        if (score !== entry.score) void patchEntry(entry.id, { score })
                      }}
                      className="w-16 rounded border border-line bg-ink-soft px-2 py-1 text-cream"
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
                      className="w-20 rounded border border-line bg-ink-soft px-2 py-1 text-cream"
                    />
                  </label>
                </div>
              </div>

              <button
                type="button"
                disabled={busyId === entry.id}
                onClick={() => void onRemove(entry.id)}
                className="self-start text-sm text-danger hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
