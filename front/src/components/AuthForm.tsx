// A single form that handles both "log in" and "sign up". The two flows share
// the same fields (email + password), so we keep one component and switch its
// behaviour via the `mode` prop instead of duplicating markup.

import { useState, type FormEvent } from 'react'
import { login, signup, type User } from '../api/auth'
import { ApiError } from '../api/client'

export type AuthMode = 'login' | 'signup'

interface AuthFormProps {
  mode: AuthMode
  // Called when auth succeeds, handing the authenticated user up to the parent.
  onSuccess: (user: User) => void
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  // Controlled inputs: React state is the single source of truth for the field
  // values, so the UI and the data can never drift apart.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // `submitting` disables the button while the request is in flight (prevents
  // double-submits); `error` holds a message to show the user.
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    // Stop the browser's default behaviour of reloading the page on submit.
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Pick the right API call based on the current mode.
      const user =
        mode === 'signup'
          ? await signup({ email, password })
          : await login({ email, password })
      onSuccess(user)
    } catch (err) {
      // Turn whatever was thrown into a readable message.
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        // Network failure, server down, CORS blocked, etc.
        setError('Could not reach the server. Is the backend running?')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          // Hint to password managers: a fresh password when signing up,
          // an existing one when logging in.
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          required
        />
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting
          ? 'Working…'
          : mode === 'signup'
            ? 'Create account'
            : 'Log in'}
      </button>
    </form>
  )
}
