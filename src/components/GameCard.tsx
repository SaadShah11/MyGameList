import { Link } from 'react-router-dom'
import type { Game } from '../types'

interface GameCardProps {
  game: Game
  index?: number
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  return (
    <Link
      to={`/games/${game.slug}`}
      className="cover-hover group animate-lift block overflow-hidden rounded-md bg-panel ring-1 ring-line"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="aspect-[3/4] overflow-hidden bg-ink-soft">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={game.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-sm text-muted">
            No cover
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-cream">
          {game.name}
        </h3>
        <p className="text-xs text-muted">
          {game.release_year ?? 'TBA'}
          {game.genres?.[0] ? ` · ${game.genres[0]}` : ''}
        </p>
      </div>
    </Link>
  )
}
