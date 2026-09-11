import { SCORE_OPTIONS } from '../types'

interface ScoreSelectProps {
  value: number | null
  onChange: (score: number | null) => void
  id?: string
  className?: string
  disabled?: boolean
}

export function ScoreSelect({
  value,
  onChange,
  id,
  className = '',
  disabled,
}: ScoreSelectProps) {
  return (
    <select
      id={id}
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? null : Number(v))
      }}
      className={`field ${className}`}
    >
      <option value="">No score</option>
      {SCORE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
