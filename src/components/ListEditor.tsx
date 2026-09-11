import { useEffect, useState, type FormEvent } from 'react'
import { StatusSelect } from './StatusSelect'
import type { GameStatus, UserGame } from '../types'

interface ListEditorProps {
  entry: UserGame | null
  defaultStatus?: GameStatus
  saving?: boolean
  onSave: (values: {
    status: GameStatus
    score: number | null
    hours_played: number | null
    notes: string | null
  }) => Promise<void>
  onRemove?: () => Promise<void>
}

export function ListEditor({
  entry,
  defaultStatus = 'plan_to_play',
  saving = false,
  onSave,
  onRemove,
}: ListEditorProps) {
  const [status, setStatus] = useState<GameStatus>(entry?.status ?? defaultStatus)
  const [score, setScore] = useState(entry?.score?.toString() ?? '')
  const [hours, setHours] = useState(entry?.hours_played?.toString() ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setStatus(entry?.status ?? defaultStatus)
    setScore(entry?.score?.toString() ?? '')
    setHours(entry?.hours_played?.toString() ?? '')
    setNotes(entry?.notes ?? '')
  }, [entry, defaultStatus])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const scoreNum = score === '' ? null : Number(score)
    const hoursNum = hours === '' ? null : Number(hours)
    if (scoreNum !== null && (scoreNum < 1 || scoreNum > 10 || Number.isNaN(scoreNum))) {
      setError('Score must be between 1 and 10')
      return
    }
    if (hoursNum !== null && (hoursNum < 0 || Number.isNaN(hoursNum))) {
      setError('Hours must be a positive number')
      return
    }
    try {
      await onSave({
        status,
        score: scoreNum,
        hours_played: hoursNum,
        notes: notes.trim() || null,
      })
      setMessage(entry ? 'Updated' : 'Added to your list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4 rounded-lg border border-line bg-panel/80 p-4"
    >
      <h3 className="font-display text-2xl tracking-wide text-cream">
        {entry ? 'Your list entry' : 'Add to list'}
      </h3>

      <label className="block space-y-1 text-sm">
        <span className="text-muted">Status</span>
        <StatusSelect value={status} onChange={setStatus} className="w-full" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Score (1–10)</span>
          <input
            type="number"
            min={1}
            max={10}
            step={0.5}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full rounded-md border border-line bg-ink-soft px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Hours played</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full rounded-md border border-line bg-ink-soft px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted">Notes</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-y rounded-md border border-line bg-ink-soft px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-accent">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 font-semibold text-ink transition hover:bg-accent-dim disabled:opacity-60"
        >
          {saving ? 'Saving…' : entry ? 'Update' : 'Add to list'}
        </button>
        {entry && onRemove && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onRemove()}
            className="rounded-md border border-danger/50 px-4 py-2 text-danger transition hover:bg-danger/10 disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  )
}
