export type GameStatus =
  | 'playing'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'plan_to_play'

export const GAME_STATUSES: GameStatus[] = [
  'playing',
  'completed',
  'on_hold',
  'dropped',
  'plan_to_play',
]

export const STATUS_LABELS: Record<GameStatus, string> = {
  playing: 'Playing',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
  plan_to_play: 'Plan to Play',
}

export const SCORE_OPTIONS = [
  { value: 1, label: '1 — Very bad' },
  { value: 2, label: '2 — Bad' },
  { value: 3, label: '3 — Poor' },
  { value: 4, label: '4 — Weak' },
  { value: 5, label: '5 — Average' },
  { value: 6, label: '6 — Fine' },
  { value: 7, label: '7 — Good' },
  { value: 8, label: '8 — Great' },
  { value: 9, label: '9 — Excellent' },
  { value: 10, label: '10 — Very good' },
] as const

export const MAX_FAVORITES = 10

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Game {
  igdb_id: number
  name: string
  slug: string
  cover_url: string | null
  release_year: number | null
  platforms: string[]
  genres: string[]
  summary: string | null
  cached_at?: string
}

export interface UserGame {
  id: string
  user_id: string
  igdb_id: number
  status: GameStatus
  score: number | null
  hours_played: number | null
  notes: string | null
  started_at: string | null
  finished_at: string | null
  is_favorite: boolean
  updated_at: string
  games?: Game
}

export interface UserGameInput {
  igdb_id: number
  status: GameStatus
  score?: number | null
  hours_played?: number | null
  notes?: string | null
  started_at?: string | null
  finished_at?: string | null
  is_favorite?: boolean
}
