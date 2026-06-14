import { useEffect, useState } from "react";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { getCurrentUser, logout, type User } from "./api/auth";
import { sessionKey } from "./crypto/session";
import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  // Covers the brief gap on load while we check for an existing session, so we
  // don't flash the login form at an already logged-in user.
  const [restoringSession, setRestoringSession] = useState(true);

  useEffect(() => {
    // On reload the auth cookie may still be valid, but decrypting cards needs
    // the encryption key, which only survives in this tab's sessionStorage. Treat
    // the user as logged in only when BOTH the key and a valid session exist.
    async function restoreSession(): Promise<User | null> {
      const cipher = await sessionKey.restoreFromStorage();
      if (!cipher) return null;
      const currentUser = await getCurrentUser().catch(() => null);
      if (!currentUser) sessionKey.clear();
      return currentUser;
    }

    restoreSession()
      .then(setUser)
      .finally(() => setRestoringSession(false));
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  }

  if (restoringSession) {
    return (
      <div className="auth-card">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthenticated={setUser} />;
  }

  return <HomePage user={user} onLogout={handleLogout} />;
}

export default App;
