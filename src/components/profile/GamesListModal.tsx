import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, X } from 'lucide-react'
import { FavoriteStarButton } from '../FavoriteStarButton'
import { Pagination } from '../Pagination'
import { ScoreSelect } from '../ScoreSelect'
import { StatusSelect } from '../StatusSelect'
import { usePreferences } from '../../context/PreferencesContext'
import { usePagedItems } from '../../hooks/usePagination'
import { clampPageSize } from '../../lib/pagination'
import {
  GAME_STATUSES,
  STATUS_LABELS,
  type GameStatus,
} from '../../types'
import {
  STATUS_BAR_COLORS,
  type ProfileGameEntry,
} from './types'

export type ListTab = 'all' | 'favorites' | GameStatus

interface GamesListModalProps {
  open: boolean
  initialTab?: ListTab
  entries: ProfileGameEntry[]
  editable?: boolean
  busyId?: string | null
  onClose: () => void
  onUpdate?: (
    id: string,
    fields: Partial<{
      status: GameStatus
      score: number | null
      hours_played: number | null
      is_favorite: boolean
    }>,
  ) => void
  onRemove?: (id: string) => void
}

export function GamesListModal({
  open,
  initialTab = 'all',
  entries,
  editable = false,
  busyId = null,
  onClose,
  onUpdate,
  onRemove,
}: GamesListModalProps) {
  const { prefs, setPref } = usePreferences()
  const [tab, setTab] = useState<ListTab>(initialTab)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const counts = useMemo(() => {
    const map: Record<ListTab, number> = {
      all: entries.length,
      favorites: entries.filter((e) => e.is_favorite).length,
      playing: 0,
      completed: 0,
      on_hold: 0,
      dropped: 0,
      plan_to_play: 0,
    }
    for (const e of entries) map[e.status] += 1
    return map
  }, [entries])

  const filtered = useMemo(() => {
    if (tab === 'all') return entries
    if (tab === 'favorites') return entries.filter((e) => e.is_favorite)
    return entries.filter((e) => e.status === tab)
  }, [entries, tab])

  const {
    items: pageItems,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = usePagedItems(filtered, prefs.pageSize, tab)

  if (!open) return null

  const tabs: { key: ListTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: 'Favourites' },
    ...GAME_STATUSES.map((s) => ({ key: s as ListTab, label: STATUS_LABELS[s] })),
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="games-list-modal-title"
        className="relative z-[81] flex h-[92vh] max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl border border-line bg-surface shadow-2xl sm:h-auto sm:max-h-[min(92vh,880px)] sm:rounded-xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-5">
          <div>
            <h2 id="games-list-modal-title" className="font-display text-xl font-bold text-ink">
              Games List
            </h2>
            <p className="text-sm text-muted">{filtered.length} in this status</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface px-3 pt-2 sm:px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
              <span className="ml-1 text-muted">({counts[t.key]})</span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No games in this status.</p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Cover</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Title</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Status</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Score</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Hours</th>
                  {editable && <th className="px-3 py-2.5 font-semibold sm:px-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((entry) => (
                  <tr key={entry.id} className="border-t border-line align-middle hover:bg-surface-2/70">
                    <td className="px-3 py-2 sm:px-4">
                      <Link
                        to={entry.game_slug ? `/games/${entry.game_slug}` : '#'}
                        className={`block h-14 w-10 overflow-hidden rounded bg-surface-2 ${
                          entry.is_favorite
                            ? 'border-2 border-[#eab308] shadow-[0_0_0_1px_rgba(234,179,8,0.35)]'
                            : 'border border-line'
                        }`}
                        onClick={onClose}
                        title={entry.is_favorite ? 'Favourite' : undefined}
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
                    </td>
                    <td className="max-w-[220px] px-3 py-2 sm:px-4">
                      <Link
                        to={entry.game_slug ? `/games/${entry.game_slug}` : '#'}
                        className="font-semibold text-ink hover:text-accent"
                        onClick={onClose}
                      >
                        {entry.game_name ?? `Game #${entry.igdb_id}`}
                      </Link>
                    </td>
                    <td className="px-3 py-2 sm:px-4">
                      {editable && onUpdate ? (
                        <StatusSelect
                          value={entry.status}
                          onChange={(status) => onUpdate(entry.id, { status })}
                          className="!w-auto !min-w-[8.5rem] !py-1 text-sm"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: STATUS_BAR_COLORS[entry.status] }}
                          />
                          {STATUS_LABELS[entry.status]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 sm:px-4">
                      {editable && onUpdate ? (
                        <ScoreSelect
                          value={entry.score}
                          disabled={busyId === entry.id}
                          className="!w-auto !min-w-[9rem] !py-1 text-sm"
                          onChange={(score) => onUpdate(entry.id, { score })}
                        />
                      ) : (
                        <span className="text-muted">{entry.score ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 sm:px-4">
                      {editable && onUpdate ? (
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          disabled={busyId === entry.id}
                          defaultValue={entry.hours_played ?? ''}
                          key={`${entry.id}-${entry.hours_played ?? 'x'}`}
                          className="field !w-20 !py-1"
                          onBlur={(e) => {
                            const v = e.target.value
                            const hours_played = v === '' ? null : Number(v)
                            if (hours_played !== entry.hours_played) {
                              onUpdate(entry.id, { hours_played })
                            }
                          }}
                        />
                      ) : (
                        <span className="text-muted">
                          {entry.hours_played != null ? entry.hours_played : '—'}
                        </span>
                      )}
                    </td>
                    {editable && (
                      <td className="px-3 py-2 sm:px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <FavoriteStarButton
                            active={entry.is_favorite}
                            disabled={busyId === entry.id}
                            onToggle={() =>
                              onUpdate?.(entry.id, { is_favorite: !entry.is_favorite })
                            }
                          />
                          <button
                            type="button"
                            disabled={busyId === entry.id}
                            className="inline-flex items-center justify-center rounded-md p-1.5 text-danger transition hover:bg-danger/10 disabled:opacity-55"
                            aria-label="Remove from list"
                            title="Remove from list"
                            onClick={() => onRemove?.(entry.id)}
                          >
                            <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <Pagination
            className="shrink-0"
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPref('pageSize', clampPageSize(size))
            }}
          />
        )}
      </div>
    </div>
  )
}
