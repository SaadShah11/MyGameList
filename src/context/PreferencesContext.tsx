import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ViewMode = 'grid' | 'list'
export type GridDensity = 'comfortable' | 'compact' | 'dense'
export type CatalogSort = 'default' | 'name' | 'year'
export type ListSort = 'updated' | 'name' | 'score' | 'status'

export interface Preferences {
  theme: ThemeMode
  catalogView: ViewMode
  listView: ViewMode
  gridDensity: GridDensity
  catalogSort: CatalogSort
  listSort: ListSort
  showPlatforms: boolean
  showGenres: boolean
  reduceMotion: boolean
}

const STORAGE_KEY = 'mgl-preferences'

const defaults: Preferences = {
  theme: 'system',
  catalogView: 'grid',
  listView: 'list',
  gridDensity: 'comfortable',
  catalogSort: 'default',
  listSort: 'updated',
  showPlatforms: true,
  showGenres: true,
  reduceMotion: false,
}

interface PreferencesContextValue {
  prefs: Preferences
  resolvedTheme: 'light' | 'dark'
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  setPrefs: (patch: Partial<Preferences>) => void
  resetPrefs: () => void
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...(JSON.parse(raw) as Partial<Preferences>) }
  } catch {
    return defaults
  }
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(() =>
    typeof window === 'undefined' ? defaults : loadPrefs(),
  )
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    typeof window === 'undefined' ? 'light' : resolveTheme(loadPrefs().theme),
  )

  const persist = useCallback((next: Preferences) => {
    setPrefsState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const setPref = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      persist({ ...prefs, [key]: value })
    },
    [persist, prefs],
  )

  const setPrefs = useCallback(
    (patch: Partial<Preferences>) => {
      persist({ ...prefs, ...patch })
    },
    [persist, prefs],
  )

  const resetPrefs = useCallback(() => persist(defaults), [persist])

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(prefs.theme)
      setResolvedTheme(resolved)
      document.documentElement.setAttribute('data-theme', resolved)
      document.body.classList.toggle('reduce-motion', prefs.reduceMotion)
    }
    apply()

    if (prefs.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [prefs.theme, prefs.reduceMotion])

  const value = useMemo(
    () => ({ prefs, resolvedTheme, setPref, setPrefs, resetPrefs }),
    [prefs, resolvedTheme, setPref, setPrefs, resetPrefs],
  )

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}

export function gridColsClass(density: GridDensity): string {
  switch (density) {
    case 'dense':
      return 'grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7'
    case 'compact':
      return 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
    default:
      return 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
  }
}
