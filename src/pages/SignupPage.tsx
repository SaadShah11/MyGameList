import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function SignupPage() {
  const { signUp, user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/profile" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      await signUp(email, password, username)
      setInfo('Account created. Check your email if confirmation is required, then log in.')
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 animate-rise">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Create profile</h1>
        <p className="mt-1 text-muted">Start tracking games under your own list.</p>
      </div>
      {!configured && (
        <p className="text-sm text-warn">Configure Supabase env vars before signing up.</p>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="panel space-y-4 p-5">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-muted">Username</span>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[A-Za-z0-9_]{3,24}"
            title="3–24 characters: letters, numbers, underscore"
            className="field"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-muted">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        {info && <p className="text-sm text-accent">{info}</p>}
        <button type="submit" disabled={busy || !configured} className="btn btn-primary w-full">
          {busy ? 'Creating…' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
}
