import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListEditor } from '../components/ListEditor'
import { useAuth } from '../context/AuthContext'
import { getGameBySlug } from '../lib/gamesApi'
import { getUserGame, removeUserGame, upsertUserGame } from '../lib/userGames'
import type { Game, UserGame } from '../types'

export function GameDetailPage() {
  const { slug = '' } = useParams()
  const { user, configured } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [entry, setEntry] = useState<UserGame | null>(null)
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
          const ug = await getUserGame(user.id, g.igdb_id)
          if (!cancelled) setEntry(ug)
        } else if (!cancelled) {
          setEntry(null)
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
        <Link to="/games" className="text-accent hover:underline">
          Back to games
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <div className="animate-lift overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        {game.cover_url ? (
          <img src={game.cover_url} alt={game.name} className="w-full object-cover" />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center text-muted">No cover</div>
        )}
      </div>

      <div className="space-y-6 animate-lift" style={{ animationDelay: '60ms' }}>
        <div className="space-y-2">
          <h1 className="font-display text-5xl tracking-wide text-cream">{game.name}</h1>
          <p className="text-muted">
            {game.release_year ?? 'TBA'}
            {game.genres?.length ? ` · ${game.genres.join(', ')}` : ''}
          </p>
          {game.platforms?.length > 0 && (
            <p className="text-sm text-muted">Platforms: {game.platforms.join(', ')}</p>
          )}
        </div>

        {game.summary && (
          <p className="max-w-2xl leading-relaxed text-cream/85">{game.summary}</p>
        )}

        {user ? (
          <ListEditor
            entry={entry}
            saving={saving}
            onSave={async (values) => {
              setSaving(true)
              try {
                const saved = await upsertUserGame(user.id, {
                  igdb_id: game.igdb_id,
                  ...values,
                })
                setEntry(saved)
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
                    } finally {
                      setSaving(false)
                    }
                  }
                : undefined
            }
          />
        ) : (
          <div className="rounded-lg border border-line bg-panel/60 p-4 text-sm text-muted">
            <Link to="/login" className="text-accent hover:underline">
              Log in
            </Link>{' '}
            to add this game to your list.
          </div>
        )}
      </div>
    </div>
  )
}
