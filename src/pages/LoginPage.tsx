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
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-4xl tracking-wide">Login</h1>
      {!configured && (
        <p className="text-sm text-amber">Configure Supabase env vars before signing in.</p>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-lg border border-line bg-panel/70 p-5">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-line bg-ink-soft px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-line bg-ink-soft px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy || !configured}
          className="w-full rounded-md bg-accent py-2.5 font-semibold text-ink hover:bg-accent-dim disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-muted">
        No account?{' '}
        <Link to="/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
