import {
  GAME_STATUSES,
  STATUS_LABELS,
  type GameStatus,
} from '../../types'

export interface ProfileIdentity {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface ProfileGameEntry {
  id: string
  igdb_id: number
  status: GameStatus
  score: number | null
  hours_played: number | null
  is_favorite: boolean
  updated_at: string
  game_name: string | null
  game_slug: string | null
  cover_url: string | null
}

/** Distinct status colors (not MAL palette). */
export const STATUS_BAR_COLORS: Record<GameStatus, string> = {
  playing: '#1f5fbf',
  completed: '#0f766e',
  on_hold: '#b45309',
  dropped: '#b91c1c',
  plan_to_play: '#64748b',
}

export function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function computeProfileStats(entries: ProfileGameEntry[]) {
  const counts: Record<GameStatus, number> = {
    playing: 0,
    completed: 0,
    on_hold: 0,
    dropped: 0,
    plan_to_play: 0,
  }
  let hours = 0
  let scoreSum = 0
  let scoreCount = 0

  for (const e of entries) {
    counts[e.status] += 1
    if (e.hours_played != null) hours += Number(e.hours_played)
    if (e.score != null) {
      scoreSum += Number(e.score)
      scoreCount += 1
    }
  }

  const total = entries.length
  const meanScore = scoreCount > 0 ? scoreSum / scoreCount : null
  const segments = GAME_STATUSES.map((status) => ({
    status,
    count: counts[status],
    pct: total > 0 ? (counts[status] / total) * 100 : 0,
    color: STATUS_BAR_COLORS[status],
    label: STATUS_LABELS[status],
  }))

  const favorites = entries.filter((e) => e.is_favorite)
  const recent = [...entries]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3)
  const lastActive = recent[0]?.updated_at ?? null

  return { counts, hours, meanScore, total, segments, favorites, recent, lastActive }
}
