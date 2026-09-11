import { Star } from 'lucide-react'

interface FavoriteStarButtonProps {
  active: boolean
  disabled?: boolean
  onToggle: () => void
  size?: number
  className?: string
}

export function FavoriteStarButton({
  active,
  disabled = false,
  onToggle,
  size = 18,
  className = '',
}: FavoriteStarButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? 'Remove from favourites' : 'Add to favourites'}
      title={active ? 'Remove from favourites' : 'Add to favourites'}
      className={`inline-flex items-center justify-center rounded-md p-1.5 transition hover:bg-surface-2 disabled:opacity-55 ${className}`}
    >
      <Star
        size={size}
        strokeWidth={1.75}
        className={active ? 'text-[#eab308]' : 'text-muted'}
        fill={active ? 'currentColor' : 'none'}
        aria-hidden
      />
    </button>
  )
}
