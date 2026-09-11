import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  className?: string
}

export function SearchBar({
  initialQuery = '',
  placeholder = 'Search games…',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const navigate = useNavigate()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/games?q=${encodeURIComponent(q)}` : '/games')
  }

  return (
    <form onSubmit={onSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-panel px-4 py-2.5 text-cream outline-none ring-accent/40 placeholder:text-muted focus:ring-2"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-accent px-4 py-2.5 font-semibold text-ink transition hover:bg-accent-dim"
      >
        Search
      </button>
    </form>
  )
}
