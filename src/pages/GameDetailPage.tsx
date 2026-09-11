import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListEditor } from '../components/ListEditor'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { getGameBySlug } from '../lib/gamesApi'
import {
  countFavorites,
  getUserGame,
  removeUserGame,
  upsertUserGame,
} from '../lib/userGames'
import type { Game, UserGame } from '../types'

export function GameDetailPage() {
  const { slug = '' } = useParams()
  const { user, configured } = useAuth()
  const { prefs } = usePreferences()
  const [game, setGame] = useState<Game | null>(null)
  const [entry, setEntry] = useState<UserGame | null>(null)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!configured) {
        setError('Supabase is not configured.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const g = await getGameBySlug(slug)
        if (!cancelled) {
          setGame(g)
          if (!g) setError('Game not found.')
        }
        if (g && user) {
          const [ug, favs] = await Promise.all([
            getUserGame(user.id, g.igdb_id),
            countFavorites(user.id),
          ])
          if (!cancelled) {
            setEntry(ug)
            setFavoriteCount(favs)
          }
        } else if (!cancelled) {
          setEntry(null)
          setFavoriteCount(0)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load game')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug, user, configured])

  if (loading) return <p className="text-muted">Loading…</p>
  if (error || !game) {
    return (
      <div className="space-y-4">
        <p className="text-danger">{error ?? 'Game not found'}</p>
        <Link to="/games" className="font-semibold text-accent hover:underline">
          Back to games
        </Link>
      </div>
    )
  }

  const genres = prefs.showGenres ? game.genres ?? [] : []
  const platforms = prefs.showPlatforms ? game.platforms ?? [] : []

  return (
    <div className="animate-rise space-y-6">
      <p className="text-sm text-muted">
        <Link to="/games" className="hover:text-accent">
          Games
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{game.name}</span>
      </p>

      <section className="panel overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)]">
          <div className="flex flex-col justify-between gap-6 p-5 sm:p-7">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted">
                  {game.release_year ?? 'TBA'}
                  {entry ? ` · ${entry.status.replaceAll('_', ' ')}` : ''}
                  {entry?.is_favorite ? ' · Favourite' : ''}
                </p>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
                  {game.name}
                </h1>
              </div>

              {(genres.length > 0 || platforms.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="rounded border border-line bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink"
                    >
                      {g}
                    </span>
                  ))}
                  {platforms.slice(0, 6).map((p) => (
                    <span
                      key={p}
                      className="rounded border border-dashed border-line px-2.5 py-1 text-xs text-muted"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {game.summary ? (
                <p className="max-w-2xl text-[15px] leading-relaxed text-ink/85">{game.summary}</p>
              ) : (
                <p className="text-sm text-muted">No description available for this title.</p>
              )}
            </div>

            {entry?.score != null && (
              <p className="text-sm text-muted">
                Your score:{' '}
                <span className="font-bold text-accent">{entry.score}</span>
                {entry.hours_played != null ? ` · ${entry.hours_played}h played` : ''}
              </p>
            )}
          </div>

          <div className="relative min-h-[240px] border-t border-line bg-surface-2 lg:min-h-full lg:border-l lg:border-t-0">
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted">
                No cover
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent lg:bg-gradient-to-l" />
          </div>
        </div>

        <div className="border-t border-line bg-surface-2/50 p-5 sm:p-7">
          {user ? (
            <ListEditor
              entry={entry}
              saving={saving}
              favoriteCount={favoriteCount}
              onSave={async (values) => {
                setSaving(true)
                try {
                  const saved = await upsertUserGame(user.id, {
                    igdb_id: game.igdb_id,
                    ...values,
                  })
                  setEntry(saved)
                  setFavoriteCount(await countFavorites(user.id))
                } finally {
                  setSaving(false)
                }
              }}
              onRemove={
                entry
                  ? async () => {
                      setSaving(true)
                      try {
                        await removeUserGame(entry.id)
                        setEntry(null)
                        setFavoriteCount(await countFavorites(user.id))
                      } finally {
                        setSaving(false)
                      }
                    }
                  : undefined
              }
            />
          ) : (
            <p className="text-sm text-muted">
              <Link to="/login" className="font-semibold text-accent hover:underline">
                Log in
              </Link>{' '}
              to add this game to your list.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
