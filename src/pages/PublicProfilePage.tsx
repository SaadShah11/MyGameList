import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ProfileDashboard,
  type ProfileGameEntry,
} from '../components/profile/ProfileDashboard'
import { useAuth } from '../context/AuthContext'
import { getPublicProfile, getPublicUserList } from '../lib/users'
import type { PublicListEntry, PublicProfile } from '../types'

function toProfileEntries(entries: PublicListEntry[]): ProfileGameEntry[] {
  return entries.map((e) => ({
    id: e.id,
    igdb_id: e.igdb_id,
    status: e.status,
    score: e.score,
    hours_played: e.hours_played,
    is_favorite: e.is_favorite,
    updated_at: e.updated_at,
    game_name: e.game_name,
    game_slug: e.game_slug,
    cover_url: e.cover_url,
  }))
}

export function PublicProfilePage() {
  const { username = '' } = useParams()
  const { user, configured } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [entries, setEntries] = useState<PublicListEntry[]>([])
  const [loading, setLoading] = useState(true)
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
        const [p, list] = await Promise.all([
          getPublicProfile(username),
          getPublicUserList(username),
        ])
        if (cancelled) return
        if (!p) {
          setProfile(null)
          setEntries([])
          setError('User not found.')
        } else {
          setProfile(p)
          setEntries(list)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load profile. Run the public profiles migration if needed.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [username, configured])

  if (loading) return <p className="text-muted">Loading profile…</p>
  if (error || !profile) {
    return (
      <div className="space-y-4">
        <p className="text-danger">{error ?? 'User not found'}</p>
        <Link to="/users" className="font-semibold text-accent hover:underline">
          Back to users
        </Link>
      </div>
    )
  }

  const isOwn = user?.id === profile.id
  if (isOwn) return <Navigate to="/profile" replace />

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        <Link to="/users" className="hover:text-accent">
          Users
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">@{profile.username}</span>
      </p>

      <ProfileDashboard
        identity={profile}
        entries={toProfileEntries(entries)}
        editable={false}
      />
    </div>
  )
}
