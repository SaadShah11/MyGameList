import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-accent' : 'text-muted hover:text-cream'
  }`

export function Layout() {
  const { user, profile, signOut, configured } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-display text-3xl tracking-wide text-cream">
            MyGame<span className="text-accent">List</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/games" className={navClass}>
              Games
            </NavLink>
            {user ? (
              <>
                <NavLink to="/profile" className={navClass}>
                  My List
                </NavLink>
                <span className="hidden text-sm text-muted sm:inline">
                  {profile?.username ?? 'player'}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="ml-1 rounded border border-line px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="ml-1 rounded bg-accent px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-accent-dim"
                >
                  Sign up
                </NavLink>
              </>
            )}
          </nav>
        </div>
        {!configured && (
          <div className="border-t border-amber/30 bg-amber/10 px-4 py-2 text-center text-sm text-amber">
            Supabase is not configured. Add <code className="font-mono">VITE_SUPABASE_*</code> keys
            to enable auth and the game library.
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line/60 py-6 text-center text-sm text-muted">
        <p>
          MyGameList — personal game tracker. Game data via{' '}
          <a
            href="https://rawg.io/"
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            RAWG
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
