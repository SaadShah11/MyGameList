import { isSupabaseConfigured, supabase } from './supabase'
import type { GameStatus, Profile, UserGame, UserGameInput } from '../types'

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'username' | 'display_name' | 'avatar_url'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUserGames(userId: string): Promise<UserGame[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('user_games')
    .select('*, games(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as UserGame[]
}

export async function getUserGame(
  userId: string,
  igdbId: number,
): Promise<UserGame | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('user_games')
    .select('*, games(*)')
    .eq('user_id', userId)
    .eq('igdb_id', igdbId)
    .maybeSingle()
  if (error) throw error
  return data as UserGame | null
}

export async function upsertUserGame(
  userId: string,
  input: UserGameInput,
): Promise<UserGame> {
  const { data, error } = await supabase
    .from('user_games')
    .upsert(
      {
        user_id: userId,
        igdb_id: input.igdb_id,
        status: input.status,
        score: input.score ?? null,
        hours_played: input.hours_played ?? null,
        notes: input.notes ?? null,
        started_at: input.started_at ?? null,
        finished_at: input.finished_at ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,igdb_id' },
    )
    .select('*, games(*)')
    .single()
  if (error) throw error
  return data as UserGame
}

export async function updateUserGameFields(
  id: string,
  fields: Partial<{
    status: GameStatus
    score: number | null
    hours_played: number | null
    notes: string | null
  }>,
): Promise<UserGame> {
  const { data, error } = await supabase
    .from('user_games')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, games(*)')
    .single()
  if (error) throw error
  return data as UserGame
}

export async function removeUserGame(id: string): Promise<void> {
  const { error } = await supabase.from('user_games').delete().eq('id', id)
  if (error) throw error
}
