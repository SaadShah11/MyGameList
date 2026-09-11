import { GAME_STATUSES, STATUS_LABELS, type GameStatus } from '../types'

interface StatusSelectProps {
  value: GameStatus
  onChange: (status: GameStatus) => void
  id?: string
  className?: string
}

export function StatusSelect({ value, onChange, id, className = '' }: StatusSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as GameStatus)}
      className={`rounded-md border border-line bg-panel px-3 py-2 text-cream outline-none focus:ring-2 focus:ring-accent/40 ${className}`}
    >
      {GAME_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  )
}
