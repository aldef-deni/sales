import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

const DEMO_ACCOUNTS = [
  { email: 'owner@aldef.test', label: 'Deni Afrizal', role: 'Owner — lihat seluruh tim' },
  { email: 'manager@aldef.test', label: 'Rina Kartika', role: 'Manager — lihat seluruh tim' },
  { email: 'budi@aldef.test', label: 'Budi Santoso', role: 'Sales — hanya data sendiri' },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('owner@aldef.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (Object.values(err.errors)[0]?.[0] ?? err.message)
          : 'Tidak bisa terhubung ke server.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-plane">
      <div className="card login-card">
        <div className="brand" style={{ padding: 0, marginBottom: 18 }}>
          <div className="brand-mark">A</div>
          <div className="brand-name">Aldef Sales OS</div>
        </div>

        <h1 className="login-title">Masuk ke akun Anda</h1>
        <p className="login-sub">Kelola prospek, pipeline, penjualan, dan komisi dalam satu tempat.</p>

        <form onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <div className="demo-accounts">
          <h4>Akun demo (password: password)</h4>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="demo-btn"
              onClick={() => { setEmail(account.email); setPassword('password') }}
            >
              <span><b>{account.label}</b> — {account.role}</span>
              <span style={{ color: 'var(--ink-muted)' }}>pakai</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
