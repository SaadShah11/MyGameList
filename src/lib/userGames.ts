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
  updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>,
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

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured')
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    throw new Error('Use a JPG, PNG, WebP, or GIF image')
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image must be 2MB or smaller')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/avatar.${ext === 'jpeg' ? 'jpg' : ext}`

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  await updateProfile(userId, { avatar_url: publicUrl })
  return publicUrl
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
        is_favorite: input.is_favorite ?? false,
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
    is_favorite: boolean
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

export async function countFavorites(userId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0
  const { count, error } = await supabase
    .from('user_games')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_favorite', true)
  if (error) throw error
  return count ?? 0
}

export async function removeUserGame(id: string): Promise<void> {
  const { error } = await supabase.from('user_games').delete().eq('id', id)
  if (error) throw error
}
