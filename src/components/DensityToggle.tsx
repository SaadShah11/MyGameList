import type { GridDensity } from '../context/PreferencesContext'

const OPTIONS: { value: GridDensity; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
  { value: 'dense', label: 'Dense' },
]

interface DensityToggleProps {
  value: GridDensity
  onChange: (density: GridDensity) => void
}

export function DensityToggle({ value, onChange }: DensityToggleProps) {
  return (
    <div className="seg relative z-20" role="group" aria-label="Grid density">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
