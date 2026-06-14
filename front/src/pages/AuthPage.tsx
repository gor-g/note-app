// The unauthenticated landing page: the login/signup tab toggle around the
// shared AuthForm.

import { useState } from "react";
import { AuthForm, type AuthMode } from "../components/AuthForm";
import type { User } from "../api/auth";

interface AuthPageProps {
  onAuthenticated: (user: User) => void;
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="auth-card">
      <h1>Memonote</h1>
      <p className="auth-subtitle">Encrypted question &amp; answer notes</p>

      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>

      {/* key={mode} remounts the form when switching tabs, clearing any error and
          typed values from the previous mode. */}
      <AuthForm key={mode} mode={mode} onSuccess={onAuthenticated} />
    </div>
  );
}
