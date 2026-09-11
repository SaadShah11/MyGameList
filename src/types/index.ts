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
}
