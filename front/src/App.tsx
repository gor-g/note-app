// Top-level component. Its only job right now is to decide which screen to
// show: the auth page when nobody is logged in, or a (placeholder) home screen
// once a user has authenticated.
//
// `user` lives here, at the root, because both screens need to know about it.
// Later this will likely move into a dedicated auth context/provider, but a
// single piece of state is enough while there's just one consumer.

import { useState } from 'react'
import { AuthPage } from './pages/AuthPage'
import type { User } from './api/auth'
import './App.css'

function App() {
  const [user, setUser] = useState<User | null>(null)

  // Not logged in → show the login / signup screen.
  if (!user) {
    return <AuthPage onAuthenticated={setUser} />
  }

  // Logged in → placeholder. This is where the notes UI (the encrypted Q&A
  // cards, fuzzy search over IndexedDB, etc.) will live in later steps.
  return (
    <div className="auth-card">
      <h1>Welcome</h1>
      <p>
        Signed in as <strong>{user.email}</strong>.
      </p>
      <button type="button" onClick={() => setUser(null)}>
        Log out
      </button>
    </div>
  )
}

export default App
