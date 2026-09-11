import { Link, NavLink, Outlet } from 'react-router-dom'
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

          <nav className="flex flex-wrap items-center gap-0.5">
            <NavLink to="/games" className={navClass}>
              Games
            </NavLink>
            {user && (
              <NavLink to="/profile" className={navClass}>
                My List
              </NavLink>
            )}
            {user ? (
              <>
                <Link
                  to="/settings"
                  className="ml-2 flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 hover:bg-surface-2"
                  title="Open settings"
                >
                  <Avatar url={profile?.avatar_url} name={label} />
                  <span className="hidden text-sm font-medium text-muted sm:inline">{label}</span>
                </Link>
                <button type="button" onClick={() => void signOut()} className="btn btn-ghost ml-1 !py-1">
                  Sign out
                </button>
              </>
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
