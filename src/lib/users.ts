import { isSupabaseConfigured, supabase } from './supabase'
import type { DirectoryUser, PublicListEntry, PublicProfile } from '../types'

export async function getDirectoryUsers(
  searchQuery = '',
  limit = 10,
): Promise<DirectoryUser[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase.rpc('get_directory_users', {
    search_query: searchQuery.trim() || null,
    result_limit: limit,
  })

  if (error) throw error
  return (data ?? []) as DirectoryUser[]
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase.rpc('get_public_profile', {
    p_username: username,
  })

  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return (row as PublicProfile) ?? null
}

export async function getPublicUserList(username: string): Promise<PublicListEntry[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase.rpc('get_public_user_list', {
    p_username: username,
  })

  if (error) throw error

  return ((data ?? []) as PublicListEntry[]).map((row) => ({
    ...row,
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    genres: Array.isArray(row.genres) ? row.genres : [],
    is_favorite: Boolean(row.is_favorite),
  }))
}
