import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  PAGE_SIZE_OPTIONS,
  pageWindow,
  totalPages,
} from '../lib/pagination'

export { PAGE_SIZE_OPTIONS, clampPageSize, paginate, totalPages } from '../lib/pagination'
export type { PageSizeOption } from '../lib/pagination'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: readonly number[]
  className?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className = '',
}: PaginationProps) {
  const pages = totalPages(total, pageSize)
  const current = Math.min(Math.max(1, page), pages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)
  const window = pageWindow(current, pages)

  return (
    <div
      className={`flex flex-col gap-3 border-t border-line bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 ${className}`}
    >
      <p className="text-sm text-muted">
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="whitespace-nowrap">Per page</span>
          <select
            className="field !w-auto !min-w-[4.5rem] !py-1.5 text-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1.5"
            disabled={current <= 1}
            aria-label="Previous page"
            onClick={() => onPageChange(current - 1)}
          >
            <ChevronLeft size={16} />
          </button>

          {window.map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-1 text-sm text-muted" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === current ? 'page' : undefined}
                className={`btn !min-w-8 !px-2 !py-1.5 text-sm ${
                  item === current ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1.5"
            disabled={current >= pages}
            aria-label="Next page"
            onClick={() => onPageChange(current + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    </div>
  )
}
