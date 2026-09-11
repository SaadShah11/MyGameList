import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `px-2.5 py-1.5 text-sm font-semibold transition-colors ${
    isActive ? 'text-accent' : 'text-muted hover:text-ink'
  }`

function Avatar({ url, name }: { url: string | null | undefined; name: string }) {
  const initial = (name || '?').slice(0, 1).toUpperCase()
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="h-8 w-8 rounded-full border border-line object-cover"
      />
    )
  }
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface-2 text-xs font-bold text-muted"
      aria-hidden
    >
      {initial}
    </span>
  )
}

function UserMenu({
  label,
  avatarUrl,
  onSignOut,
}: {
  label: string
  avatarUrl: string | null | undefined
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const itemClass =
    'flex w-full items-center gap-2.5 px-3 py-2 text-left no-underline hover:bg-surface-2'
  const labelStyle = {
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
  } as const

  return (
    <div ref={rootRef} className="relative ml-2">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-transparent py-0.5 pl-2.5 pr-0.5 transition hover:border-line hover:bg-surface-2"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="max-w-[9rem] truncate text-sm font-medium text-ink sm:max-w-[12rem]">
          {label}
        </span>
        <Avatar url={avatarUrl} name={label} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            to="/profile"
            className={`${itemClass} text-ink`}
            style={labelStyle}
            onClick={() => setOpen(false)}
          >
            <User size={16} strokeWidth={1.75} className="shrink-0 opacity-80" aria-hidden />
            <span style={labelStyle}>Profile</span>
          </Link>
          <Link
            role="menuitem"
            to="/settings"
            className={`${itemClass} text-ink`}
            style={labelStyle}
            onClick={() => setOpen(false)}
          >
            <Settings size={16} strokeWidth={1.75} className="shrink-0 opacity-80" aria-hidden />
            <span style={labelStyle}>Settings</span>
          </Link>
          <div
            role="menuitem"
            tabIndex={0}
            className={`${itemClass} mx-1 my-0.5 cursor-pointer rounded-sm bg-danger text-white hover:bg-danger hover:brightness-95`}
            style={labelStyle}
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setOpen(false)
                onSignOut()
              }
            }}
          >
            <LogOut size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />
            <span style={labelStyle}>Sign out</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function Layout() {
  const { user, profile, signOut, configured } = useAuth()
  const label = profile?.display_name || profile?.username || 'player'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-ink">
            MyGame<span className="text-accent">List</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/games" className={navClass}>
              Games
            </NavLink>
            <NavLink to="/users" className={navClass}>
              Users
            </NavLink>
            {user ? (
              <UserMenu
                label={label}
                avatarUrl={profile?.avatar_url}
                onSignOut={() => void signOut()}
              />
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  Login
                </NavLink>
                <NavLink to="/signup" className="btn btn-primary ml-1 !py-1.5">
                  Sign up
                </NavLink>
              </>
            )}
          </nav>
        </div>
        {!configured && (
          <div className="border-t border-line bg-surface-2 px-4 py-2 text-center text-sm text-warn">
            Supabase is not configured. Add <code className="font-mono">VITE_SUPABASE_*</code> keys
            to enable auth and the game library.
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display font-bold text-ink">
            MyGame<span className="text-accent">List</span>
          </p>
          <p>
            Personal game tracker. Data from{' '}
            <a
              href="https://rawg.io/"
              className="font-semibold text-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              RAWG
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}
