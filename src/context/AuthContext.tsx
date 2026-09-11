import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getProfile } from '../lib/userGames'
import type { Profile } from '../types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  configured: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const p = await getProfile(uid)
      setProfile(p)
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        void loadProfile(data.session.user.id).finally(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
      if (next?.user) {
        void loadProfile(next.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured')
      }
      const cleaned = username.trim().toLowerCase()
      if (!/^[a-z0-9_]{3,24}$/.test(cleaned)) {
        throw new Error(
          'Username must be 3–24 characters: letters, numbers, underscore only',
        )
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: cleaned } },
      })
      if (error) throw error
    },
    [],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured')
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [loadProfile, user])

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      configured: isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, loading, signUp, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
