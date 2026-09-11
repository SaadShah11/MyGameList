import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePreferences } from '../context/PreferencesContext'
import type { Game, GameStatus } from '../types'
import { QuickStatusSelect } from './QuickStatusSelect'

interface GameCardProps {
  game: Game
  index?: number
  metaRight?: ReactNode
  status?: GameStatus | null
  statusDisabled?: boolean
  onStatusChange?: (status: GameStatus | null) => void
  showStatus?: boolean
}

export function GameCard({
  game,
  index = 0,
  metaRight,
  status = null,
  statusDisabled,
  onStatusChange,
  showStatus = false,
}: GameCardProps) {
  const { prefs } = usePreferences()

  return (
    <article
      className="cover-zoom animate-rise overflow-hidden rounded-md border border-line bg-surface"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <Link to={`/games/${game.slug}`} className="group block">
        <div className="aspect-[3/4] overflow-hidden bg-surface-2">
          {game.cover_url ? (
            <img
              src={game.cover_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
              No cover
            </div>
          )}
        </div>
        <div className="space-y-0.5 p-2.5 pb-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-accent">
              {game.name}
            </h3>
            {metaRight}
          </div>
          <p className="text-xs text-muted">
            {game.release_year ?? 'TBA'}
            {prefs.showGenres && game.genres?.[0] ? ` · ${game.genres[0]}` : ''}
          </p>
          {prefs.showPlatforms && game.platforms?.length > 0 && (
            <p className="line-clamp-1 text-[11px] text-muted/80">
              {game.platforms.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
      </Link>
      {showStatus && onStatusChange && (
        <div className="border-t border-line p-2">
          <QuickStatusSelect
            value={status}
            disabled={statusDisabled}
            onChange={onStatusChange}
            compact
            className="w-full"
          />
        </div>
      )}
    </article>
  )
}

interface GameListRowProps {
  game: Game
  trailing?: ReactNode
  status?: GameStatus | null
  statusDisabled?: boolean
  onStatusChange?: (status: GameStatus | null) => void
  showStatus?: boolean
}

export function GameListRow({
  game,
  trailing,
  status = null,
  statusDisabled,
  onStatusChange,
  showStatus = false,
}: GameListRowProps) {
  const { prefs } = usePreferences()

  return (
    <article className="grid grid-cols-[56px_1fr] items-center gap-3 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[64px_1fr_auto]">
      <Link
        to={`/games/${game.slug}`}
        className="overflow-hidden rounded border border-line bg-surface-2"
      >
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt=""
            loading="lazy"
            className="aspect-[3/4] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center text-[10px] text-muted">
            —
          </div>
        )}
      </Link>
      <div className="min-w-0">
        <Link
          to={`/games/${game.slug}`}
          className="block truncate font-semibold text-ink hover:text-accent"
        >
          {game.name}
        </Link>
        <p className="truncate text-sm text-muted">
          {game.release_year ?? 'TBA'}
          {prefs.showGenres && game.genres?.length ? ` · ${game.genres.slice(0, 2).join(', ')}` : ''}
          {prefs.showPlatforms && game.platforms?.length
            ? ` · ${game.platforms.slice(0, 2).join(', ')}`
            : ''}
        </p>
        {showStatus && onStatusChange && (
          <div className="mt-2 sm:hidden">
            <QuickStatusSelect
              value={status}
              disabled={statusDisabled}
              onChange={onStatusChange}
              compact
              className="w-full max-w-[200px]"
            />
          </div>
        )}
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 sm:col-span-1 sm:flex-nowrap">
        {showStatus && onStatusChange && (
          <div className="hidden sm:block">
            <QuickStatusSelect
              value={status}
              disabled={statusDisabled}
              onChange={onStatusChange}
              className="!w-[150px]"
            />
          </div>
        )}
        {trailing}
      </div>
    </article>
  )
}
