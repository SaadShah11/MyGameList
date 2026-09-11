import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ProfileDashboard,
  type ProfileGameEntry,
} from '../components/profile/ProfileDashboard'
import { useAuth } from '../context/AuthContext'
import {
  getUserGames,
  removeUserGame,
  updateUserGameFields,
} from '../lib/userGames'
import { MAX_FAVORITES, type GameStatus, type UserGame } from '../types'

function toProfileEntries(entries: UserGame[]): ProfileGameEntry[] {
  return entries.map((e) => ({
    id: e.id,
    igdb_id: e.igdb_id,
    status: e.status,
    score: e.score,
    hours_played: e.hours_played,
    is_favorite: e.is_favorite,
    updated_at: e.updated_at,
    game_name: e.games?.name ?? null,
    game_slug: e.games?.slug ?? null,
    cover_url: e.games?.cover_url ?? null,
  }))
}

export function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<UserGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  if (authLoading || loading) return <p className="text-muted">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <p className="text-muted">Profile not found.</p>

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
        const favoriteCount = entries.filter((e) => e.is_favorite).length
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

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      <ProfileDashboard
        identity={profile}
        entries={toProfileEntries(entries)}
        isOwner
        settingsHref="/settings"
        editable
        busyId={busyId}
        onUpdateEntry={(id, fields) => void patchEntry(id, fields)}
        onRemoveEntry={(id) => void onRemove(id)}
      />
    </div>
  )
}
