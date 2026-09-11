import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GamesListModal, type ListTab } from './GamesListModal'
import {
  computeProfileStats,
  formatJoined,
  formatRelativeShort,
  STATUS_BAR_COLORS,
  type ProfileGameEntry,
  type ProfileIdentity,
} from './types'
import { STATUS_LABELS, type GameStatus } from '../../types'

export type { ProfileGameEntry, ProfileIdentity } from './types'
export { STATUS_BAR_COLORS, computeProfileStats } from './types'

interface ProfileDashboardProps {
  identity: ProfileIdentity
  entries: ProfileGameEntry[]
  isOwner?: boolean
  settingsHref?: string
  editable?: boolean
  busyId?: string | null
  onUpdateEntry?: (
    id: string,
    fields: Partial<{
      status: GameStatus
      score: number | null
      hours_played: number | null
      is_favorite: boolean
    }>,
  ) => void
  onRemoveEntry?: (id: string) => void
  children?: ReactNode
}

export function ProfileDashboard({
  identity,
  entries,
  isOwner = false,
  settingsHref,
  editable = false,
  busyId = null,
  onUpdateEntry,
  onRemoveEntry,
}: ProfileDashboardProps) {
  const name = identity.display_name || identity.username
  const stats = computeProfileStats(entries)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<ListTab>('all')

  function openList(tab: ListTab) {
    setModalTab(tab)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="panel space-y-4 self-start p-4">
          <div className="overflow-hidden rounded-md border border-line bg-surface-2">
            {identity.avatar_url ? (
              <img
                src={identity.avatar_url}
                alt=""
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-4xl font-bold text-muted">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-ink">
              {name}
            </h1>
            <p className="text-sm text-muted">@{identity.username}</p>
          </div>

          <dl className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Last Online</dt>
              <dd className="text-right font-medium text-ink">
                {stats.lastActive ? formatRelativeShort(stats.lastActive) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Joined</dt>
              <dd className="text-right font-medium text-ink">
                {formatJoined(identity.created_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Games</dt>
              <dd className="text-right font-medium text-ink">{stats.total}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Favourites</dt>
              <dd className="text-right font-medium text-ink">{stats.favorites.length}</dd>
            </div>
          </dl>

          <div className="space-y-2 border-t border-line pt-3">
            <button type="button" className="btn btn-primary w-full" onClick={() => openList('all')}>
              Games List
            </button>
            {isOwner && settingsHref && (
              <Link to={settingsHref} className="btn btn-ghost w-full">
                Settings
              </Link>
            )}
          </div>

          <nav className="space-y-1 border-t border-line pt-3 text-sm">
            <a href="#statistics" className="block rounded px-2 py-1.5 font-medium text-ink hover:bg-surface-2">
              Statistics
            </a>
            <a href="#updates" className="block rounded px-2 py-1.5 font-medium text-ink hover:bg-surface-2">
              History
            </a>
            <a href="#favorites" className="block rounded px-2 py-1.5 font-medium text-ink hover:bg-surface-2">
              Favourites
            </a>
            <button
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left font-medium text-ink hover:bg-surface-2"
              onClick={() => openList('all')}
            >
              Full list
            </button>
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          <section id="statistics" className="panel overflow-hidden">
            <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                  <h2 className="font-display text-xl font-bold leading-none text-ink">
                    Game Statistics
                  </h2>
                  <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                    <div className="flex flex-col items-end justify-end">
                      <p className="mb-1 text-[11px] leading-none font-medium uppercase tracking-wide text-muted">
                        Total Hours
                      </p>
                      <p className="font-display text-xl leading-none font-bold tabular-nums text-ink">
                        {stats.hours.toFixed(1)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-end">
                      <p className="mb-1 text-[11px] leading-none font-medium uppercase tracking-wide text-muted">
                        Mean Score
                      </p>
                      <p className="font-display text-xl leading-none font-bold tabular-nums text-ink">
                        {stats.meanScore != null ? stats.meanScore.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-end">
                      <p className="mb-1 text-[11px] leading-none font-medium uppercase tracking-wide text-muted">
                        Entries
                      </p>
                      <p className="font-display text-xl leading-none font-bold tabular-nums text-ink">
                        {stats.total}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-3.5 w-full overflow-hidden rounded-sm border border-line bg-surface-2"
                  aria-label="Open games list"
                  onClick={() => openList('all')}
                >
                  {stats.total === 0 ? (
                    <div className="h-full w-full bg-surface-2" />
                  ) : (
                    stats.segments
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <div
                          key={s.status}
                          style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                          title={`${s.label}: ${s.count}`}
                        />
                      ))
                  )}
                </button>

                <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <ul className="space-y-0.5 text-sm">
                    {stats.segments.map((s) => (
                      <li key={s.status}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1.5 text-left hover:bg-surface-2"
                          onClick={() => openList(s.status)}
                        >
                          <span className="flex items-center gap-2 text-ink">
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {s.label}
                          </span>
                          <span className="font-semibold tabular-nums text-accent">{s.count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-0.5 text-sm">
                    <li>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1.5 text-left text-muted hover:bg-surface-2"
                        onClick={() => openList('all')}
                      >
                        <span>Total Entries</span>
                        <span className="font-semibold tabular-nums text-ink">{stats.total}</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1.5 text-left text-muted hover:bg-surface-2"
                        onClick={() => openList('favorites')}
                      >
                        <span>Favourites</span>
                        <span className="font-semibold tabular-nums text-ink">
                          {stats.favorites.length}
                        </span>
                      </button>
                    </li>
                    <li className="flex items-center justify-between gap-2 px-1.5 py-1.5 text-muted">
                      <span>Scored Games</span>
                      <span className="font-semibold tabular-nums text-ink">
                        {entries.filter((e) => e.score != null).length}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-2 px-1.5 py-1.5 text-muted">
                      <span>Hours Played</span>
                      <span className="font-semibold tabular-nums text-ink">
                        {stats.hours.toFixed(1)}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div
                id="updates"
                className="border-t border-line bg-surface-2/40 p-4 sm:p-5 lg:border-t-0 lg:border-l"
              >
                <h2 className="mb-4 font-display text-xl font-bold text-ink">Last Game Updates</h2>
                {stats.recent.length === 0 ? (
                  <p className="text-sm text-muted">No updates yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {stats.recent.map((entry) => (
                      <li key={entry.id} className="flex gap-3">
                        <Link
                          to={entry.game_slug ? `/games/${entry.game_slug}` : '#'}
                          className="h-[72px] w-[52px] shrink-0 overflow-hidden rounded border border-line bg-surface"
                        >
                          {entry.cover_url ? (
                            <img
                              src={entry.cover_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-muted">
                              —
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={entry.game_slug ? `/games/${entry.game_slug}` : '#'}
                              className="truncate text-sm font-semibold text-ink hover:text-accent"
                            >
                              {entry.game_name ?? `Game #${entry.igdb_id}`}
                            </Link>
                            <span className="shrink-0 text-[11px] text-muted">
                              {formatRelativeShort(entry.updated_at)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-surface">
                            <div
                              className="h-full rounded-sm"
                              style={{
                                width:
                                  entry.status === 'completed'
                                    ? '100%'
                                    : entry.status === 'playing'
                                      ? '55%'
                                      : entry.status === 'on_hold'
                                        ? '35%'
                                        : entry.status === 'dropped'
                                          ? '20%'
                                          : '10%',
                                backgroundColor: STATUS_BAR_COLORS[entry.status],
                              }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            {STATUS_LABELS[entry.status]}
                            {entry.score != null ? ` · Score ${entry.score}` : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section id="favorites" className="panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-ink">Favourites</h2>
              <button
                type="button"
                className="text-sm font-semibold text-accent hover:underline"
                onClick={() => openList('favorites')}
              >
                All Favourites
              </button>
            </div>
            {stats.favorites.length === 0 ? (
              <p className="text-sm text-muted">No favourite games yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {stats.favorites.map((entry) => (
                  <Link
                    key={entry.id}
                    to={entry.game_slug ? `/games/${entry.game_slug}` : '#'}
                    className="cover-zoom block w-[110px] shrink-0 overflow-hidden rounded-md border border-line bg-surface-2 sm:w-[128px]"
                    title={entry.game_name ?? undefined}
                  >
                    {entry.cover_url ? (
                      <img
                        src={entry.cover_url}
                        alt={entry.game_name ?? ''}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] items-center justify-center px-2 text-center text-xs text-muted">
                        {entry.game_name}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <GamesListModal
        open={modalOpen}
        initialTab={modalTab}
        entries={entries}
        editable={editable}
        busyId={busyId}
        onClose={() => setModalOpen(false)}
        onUpdate={onUpdateEntry}
        onRemove={onRemoveEntry}
      />
    </div>
  )
}
