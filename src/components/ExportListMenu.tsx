import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { exportUserList, type ExportFormat } from '../lib/exportList'
import type { UserGame } from '../types'

interface ExportListMenuProps {
  entries: UserGame[]
  username: string
  disabled?: boolean
}

const OPTIONS: { format: ExportFormat; label: string; hint: string }[] = [
  { format: 'csv', label: 'CSV', hint: 'Works in Sheets & Excel' },
  { format: 'excel', label: 'Excel', hint: 'Spreadsheet (.xls)' },
  { format: 'json', label: 'JSON', hint: 'Full structured data' },
]

export function ExportListMenu({ entries, username, disabled }: ExportListMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function onExport(format: ExportFormat) {
    exportUserList(entries, format, username)
    setOpen(false)
  }

  const empty = entries.length === 0

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="btn btn-ghost w-full"
        disabled={disabled || empty}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Download size={16} aria-hidden />
        Export list
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 left-0 z-30 mt-1 overflow-hidden rounded-md border border-line bg-surface shadow-lg"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.format}
              type="button"
              role="menuitem"
              className="flex w-full flex-col items-start gap-0.5 border-b border-line px-3 py-2.5 text-left last:border-b-0 hover:bg-surface-2"
              onClick={() => onExport(opt.format)}
            >
              <span className="text-sm font-semibold text-ink">{opt.label}</span>
              <span className="text-xs text-muted">{opt.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
