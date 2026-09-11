import type { ViewMode } from '../context/PreferencesContext'

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="seg" role="group" aria-label="View mode">
      <button
        type="button"
        aria-pressed={value === 'grid'}
        onClick={() => onChange('grid')}
      >
        Grid
      </button>
      <button
        type="button"
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
      >
        List
      </button>
    </div>
  )
}
