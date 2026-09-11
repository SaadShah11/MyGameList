import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { Pagination } from '../components/Pagination'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { usePagedItems } from '../hooks/usePagination'
import { clampPageSize } from '../lib/pagination'
import { getDirectoryUsers } from '../lib/users'
import { STATUS_LABELS, type DirectoryUser, type GameStatus } from '../types'

function formatRelative(iso: string | null): string {
  if (!iso) return 'No activity yet'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function statusLabel(status: string | null): string {
  if (!status) return ''
  return STATUS_LABELS[status as GameStatus] ?? status.replaceAll('_', ' ')
}

export function UsersPage() {
  const { configured } = useAuth()
  const { prefs, setPref } = usePreferences()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [users, setUsers] = useState<DirectoryUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!configured) {
        setUsers([])
        setLoading(false)
        setError('Configure Supabase to load users.')
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await getDirectoryUsers(submitted, 50)
        if (!cancelled) setUsers(data)
      } catch (err) {
        if (!cancelled) {
          setUsers([])
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load users. Run the users directory migration if you have not.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [configured, submitted])

  const {
    items: pageUsers,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = usePagedItems(users, prefs.pageSize, submitted)

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setSubmitted(query.trim())
  }

  function onPageSizeChange(size: number) {
    const next = clampPageSize(size)
    setPageSize(next)
    setPref('pageSize', next)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-extrabold text-ink md:text-4xl">Users</h1>
        <p className="text-muted">
          {submitted
            ? `Search results for “${submitted}”.`
            : 'People with the most recent list activity.'}
        </p>
        <form onSubmit={onSearch} className="flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or display name…"
              className="field !pl-9"
            />
          </div>
          <button type="submit" className="btn btn-primary shrink-0">
            Search
          </button>
          {submitted && (
            <button
              type="button"
              className="btn btn-ghost shrink-0"
              onClick={() => {
                setQuery('')
                setSubmitted('')
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {loading && <p className="text-muted">Loading users…</p>}
      {error && (
        <div className="panel border-danger/40 px-4 py-3 text-sm text-danger">{error}</div>
      )}
      {!loading && !error && users.length === 0 && (
        <div className="panel flex flex-col items-center gap-2 border-dashed p-10 text-center text-muted">
          <Users size={28} className="opacity-60" aria-hidden />
          <p>{submitted ? 'No users matched that search.' : 'No users yet.'}</p>
        </div>
      )}

      <div className="space-y-3">
        {pageUsers.map((person) => {
          const name = person.display_name || person.username
          const profileTo = `/users/${person.username}`
          return (
            <article
              key={person.id}
              className="panel overflow-hidden transition hover:border-accent/40"
            >
              <div className="grid gap-0 md:grid-cols-[1fr_160px]">
                <Link
                  to={profileTo}
                  className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center"
                >
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-base font-bold text-muted">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-lg font-semibold text-ink">{name}</p>
                    <p className="text-sm text-muted">@{person.username}</p>
                    <p className="text-sm text-muted">
                      {person.list_count} game{person.list_count === 1 ? '' : 's'} on list
                      {' · '}
                      {formatRelative(person.last_active_at)}
                    </p>
                    {person.recent_game_name ? (
                      <p className="text-sm text-ink">
                        Recent:{' '}
                        <span className="font-semibold">{person.recent_game_name}</span>
                        {person.recent_status ? (
                          <span className="text-muted">
                            {' '}
                            · {statusLabel(person.recent_status)}
                          </span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-sm text-muted">No games tracked yet.</p>
                    )}
                  </div>
                </Link>

                <div className="relative min-h-[120px] border-t border-line bg-surface-2 md:border-t-0 md:border-l">
                  {person.recent_game_cover ? (
                    <Link
                      to={profileTo}
                      className="absolute inset-0 block"
                      aria-label={`Open ${name}'s profile`}
                    >
                      <img
                        src={person.recent_game_cover}
                        alt={person.recent_game_name ?? 'Recent game'}
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:bg-gradient-to-l" />
                      {person.recent_game_name && (
                        <span className="absolute right-2 bottom-2 left-2 truncate text-xs font-semibold text-white drop-shadow">
                          {person.recent_game_name}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <Link
                      to={profileTo}
                      className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted"
                    >
                      No recent cover
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {!loading && !error && total > 0 && (
        <div className="panel overflow-hidden">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  )
}
