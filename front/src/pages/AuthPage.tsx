// The unauthenticated landing page. Owns the login/signup tab toggle and
// renders the shared AuthForm in the selected mode.

import { useState } from 'react'
import { AuthForm, type AuthMode } from '../components/AuthForm'
import type { User } from '../api/auth'

interface AuthPageProps {
  onAuthenticated: (user: User) => void
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login')

  return (
    <div className="auth-card">
      <h1>Memonote</h1>
      <p className="auth-subtitle">Encrypted question &amp; answer notes</p>

      {/* Tab switch between the two modes. We pass `mode` down to the form so
          it knows which API call to make. */}
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === 'signup' ? 'active' : ''}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
      </div>

      {/* `key={mode}` remounts the form when switching tabs, which clears any
          error message and typed values from the previous mode. */}
      <AuthForm key={mode} mode={mode} onSuccess={onAuthenticated} />
    </div>
  )
}
