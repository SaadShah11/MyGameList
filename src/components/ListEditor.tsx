import { useEffect, useState, type FormEvent } from 'react'
import { FavoriteStarButton } from './FavoriteStarButton'
import { ScoreSelect } from './ScoreSelect'
import { StatusSelect } from './StatusSelect'
import { MAX_FAVORITES, type GameStatus, type UserGame } from '../types'

interface ListEditorProps {
  entry: UserGame | null
  defaultStatus?: GameStatus
  saving?: boolean
  favoriteCount?: number
  onSave: (values: {
    status: GameStatus
    score: number | null
    hours_played: number | null
    notes: string | null
    is_favorite: boolean
  }) => Promise<void>
  onRemove?: () => Promise<void>
}

export function ListEditor({
  entry,
  defaultStatus = 'plan_to_play',
  saving = false,
  favoriteCount = 0,
  onSave,
  onRemove,
}: ListEditorProps) {
  const [status, setStatus] = useState<GameStatus>(entry?.status ?? defaultStatus)
  const [score, setScore] = useState<number | null>(entry?.score ?? null)
  const [hours, setHours] = useState(entry?.hours_played?.toString() ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [isFavorite, setIsFavorite] = useState(entry?.is_favorite ?? false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setStatus(entry?.status ?? defaultStatus)
    setScore(entry?.score ?? null)
    setHours(entry?.hours_played?.toString() ?? '')
    setNotes(entry?.notes ?? '')
    setIsFavorite(entry?.is_favorite ?? false)
  }, [entry, defaultStatus])

  const othersFavorited = favoriteCount - (entry?.is_favorite ? 1 : 0)
  const favoriteSlotsLeft = MAX_FAVORITES - othersFavorited
  const canFavorite = isFavorite || favoriteSlotsLeft > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const hoursNum = hours === '' ? null : Number(hours)
    if (hoursNum !== null && (hoursNum < 0 || Number.isNaN(hoursNum))) {
      setError('Hours must be a positive number')
      return
    }
    if (isFavorite && !canFavorite) {
      setError(`You can favourite at most ${MAX_FAVORITES} games`)
      return
    }
    try {
      await onSave({
        status,
        score,
        hours_played: hoursNum,
        notes: notes.trim() || null,
        is_favorite: isFavorite,
      })
      setMessage(entry ? 'List entry updated' : 'Added to your list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <h3 className="font-display text-lg font-bold text-ink">
        {entry ? 'Your list entry' : 'Add to list'}
      </h3>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-muted">Status</span>
        <StatusSelect value={status} onChange={setStatus} />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-muted">Score</span>
          <ScoreSelect value={score} onChange={setScore} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-muted">Hours played</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="field"
          />
        </label>
      </div>

      <div className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5 text-sm">
        <FavoriteStarButton
          active={isFavorite}
          disabled={!canFavorite && !isFavorite}
          onToggle={() => {
            if (!isFavorite && !canFavorite) {
              setError(`You can favourite at most ${MAX_FAVORITES} games`)
              return
            }
            setIsFavorite((v) => !v)
          }}
        />
        <span className="min-w-0">
          <span className="block font-medium text-ink">Favourite</span>
          <span className="block text-muted">
            Tap the star to mark this as a favourite ({othersFavorited}/{MAX_FAVORITES} used
            {isFavorite ? ', including this one' : ''})
          </span>
        </span>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-muted">Notes</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="field resize-y"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-accent">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : entry ? 'Update' : 'Add to list'}
        </button>
        {entry && onRemove && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onRemove()}
            className="btn btn-danger"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  )
}
