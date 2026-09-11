import { GAME_STATUSES, STATUS_LABELS, type GameStatus } from '../types'

interface QuickStatusSelectProps {
  value: GameStatus | null
  disabled?: boolean
  onChange: (status: GameStatus | null) => void
  className?: string
  compact?: boolean
}

/** Status picker that does not navigate when used inside cards/rows. */
export function QuickStatusSelect({
  value,
  disabled,
  onChange,
  className = '',
  compact = false,
}: QuickStatusSelectProps) {
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      aria-label="List status"
      className={`field ${compact ? '!py-1 !text-xs' : '!py-1.5 text-sm'} ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation()
        const next = e.target.value
        onChange(next === '' ? null : (next as GameStatus))
      }}
    >
      <option value="">Not in list</option>
      {GAME_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  )
}
