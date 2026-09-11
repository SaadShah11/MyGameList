import { Link } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { useAuth } from '../context/AuthContext'

export function HomePage() {
  const { user, profile } = useAuth()

  return (
    <section className="relative overflow-hidden border-b border-line pb-2">
      <div className="grid gap-10 py-10 md:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="animate-rise space-y-6">
          <p className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-ink sm:text-6xl md:text-7xl">
            MyGame<span className="text-accent">List</span>
          </p>
          <h1 className="max-w-lg text-xl font-medium text-ink/90 sm:text-2xl">
            A quiet place to track what you play.
          </h1>
          <p className="max-w-md text-muted">
            Search a large catalog, rate titles, and keep Playing / Completed / Plan to Play in one
            list — without the noise.
          </p>
          <SearchBar className="max-w-xl" />
          <div className="flex flex-wrap gap-2">
            <Link to="/games" className="btn btn-primary">
              Browse games
            </Link>
            {user ? (
              <Link to="/profile" className="btn btn-ghost">
                Open {profile?.username ? `@${profile.username}` : 'your'} list
              </Link>
            ) : (
              <Link to="/signup" className="btn btn-ghost">
                Create a profile
              </Link>
            )}
          </div>
        </div>

        <div
          className="animate-rise panel relative hidden min-h-56 overflow-hidden p-6 md:block"
          style={{ animationDelay: '80ms' }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'linear-gradient(var(--mgl-line) 1px, transparent 1px), linear-gradient(90deg, var(--mgl-line) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'radial-gradient(circle at 70% 40%, black, transparent 75%)',
            }}
          />
          <div className="relative space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Your backlog, clarified
            </p>
            <ul className="space-y-3 text-sm text-ink">
              <li className="flex justify-between border-b border-line pb-2">
                <span>Playing</span>
                <span className="text-muted">in progress</span>
              </li>
              <li className="flex justify-between border-b border-line pb-2">
                <span>Completed</span>
                <span className="text-muted">scored & dated</span>
              </li>
              <li className="flex justify-between border-b border-line pb-2">
                <span>Plan to Play</span>
                <span className="text-muted">queued</span>
              </li>
              <li className="flex justify-between">
                <span>On Hold / Dropped</span>
                <span className="text-muted">honest tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
