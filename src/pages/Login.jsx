import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react'

export default function Login() {
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 350))
    const result = login(email, password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  const fillDemo = (role) => {
    if (role === 'admin') { setEmail('admin@niwas.app'); setPassword('admin123') }
    else { setEmail('resident1@example.com'); setPassword('res123') }
    setError('')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-niwas-bg px-5">
      <div className="flex-1 flex flex-col items-center justify-center gap-10 max-w-sm mx-auto w-full py-12">

        {/* Logo */}
        <div className="flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-niwas-primary flex items-center justify-center">
            <Building2 size={32} className="text-niwas-inverse" strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-niwas-text tracking-tight">NIWAS</h1>
            <p className="text-xs text-niwas-muted mt-0.5 tracking-wide">Smart Building Manager</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-niwas-subtle pointer-events-none" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-niwas-subtle pointer-events-none" />
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pl-10 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-niwas-subtle hover:text-niwas-muted cursor-pointer transition-colors"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-niwas-muted bg-niwas-elevated border border-niwas-border rounded-xl px-4 py-3" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo quick-login */}
        <div className="w-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-niwas-border" />
            <span className="text-[11px] text-niwas-subtle uppercase tracking-wider">Quick demo</span>
            <div className="flex-1 h-px bg-niwas-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => fillDemo('admin')} className="btn-secondary text-sm">
              Admin
            </button>
            <button onClick={() => fillDemo('resident')} className="btn-secondary text-sm">
              Resident
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-niwas-subtle pb-8">
        NIWAS v1.0 · Building Management SaaS
      </p>
    </div>
  )
}
