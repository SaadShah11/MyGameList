import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  className?: string
}

export function SearchBar({
  initialQuery = '',
  placeholder = 'Search the catalog…',
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
        className="field"
      />
      <button type="submit" className="btn btn-primary shrink-0">
        Search
      </button>
    </form>
  )
}
