import { Link } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { useAuth } from '../context/AuthContext'

export function HomePage() {
  const { user, profile } = useAuth()

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-ink-soft/60">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(36,48,73,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(36,48,73,0.35) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative grid gap-10 px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-2xl space-y-5 animate-lift">
          <p className="font-display text-6xl leading-none tracking-wide text-cream sm:text-7xl md:text-8xl">
            MyGame<span className="text-accent">List</span>
          </p>
          <h1 className="max-w-xl text-xl font-medium text-cream/90 sm:text-2xl">
            Track what you play. Rate what you finish. Build your personal games library.
          </h1>
          <p className="max-w-lg text-muted">
            Browse a huge catalog, add titles to your list, and keep Playing, Completed, On Hold,
            Dropped, and Plan to Play in one place.
          </p>
        </div>

        <div className="max-w-xl animate-lift" style={{ animationDelay: '80ms' }}>
          <SearchBar />
        </div>

        <div className="flex flex-wrap gap-3 animate-lift" style={{ animationDelay: '140ms' }}>
          <Link
            to="/games"
            className="rounded-md bg-accent px-5 py-2.5 font-semibold text-ink transition hover:bg-accent-dim"
          >
            Browse games
          </Link>
          {user ? (
            <Link
              to="/profile"
              className="rounded-md border border-line px-5 py-2.5 font-medium text-cream transition hover:border-accent hover:text-accent"
            >
              Open {profile?.username ? `${profile.username}'s` : 'your'} list
            </Link>
          ) : (
            <Link
              to="/signup"
              className="rounded-md border border-line px-5 py-2.5 font-medium text-cream transition hover:border-accent hover:text-accent"
            >
              Create a profile
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
