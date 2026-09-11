import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { signIn, user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/profile" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signIn(email, password)
      navigate('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 animate-rise">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Login</h1>
        <p className="mt-1 text-muted">Sign in to manage your game list.</p>
      </div>
      {!configured && (
        <p className="text-sm text-warn">Configure Supabase env vars before signing in.</p>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="panel space-y-4 p-5">
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
        <button type="submit" disabled={busy || !configured} className="btn btn-primary w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-muted">
        No account?{' '}
        <Link to="/signup" className="font-semibold text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
