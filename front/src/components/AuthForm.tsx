// A single form that handles both "log in" and "sign up". The two flows share
// the same fields, so we switch behaviour via the `mode` prop instead of
// duplicating markup.

import { useState, type FormEvent } from "react";
import { login, signup, type User } from "../api/auth";
import { ApiError } from "../api/client";

export type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  onSuccess: (user: User) => void;
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user =
        mode === "signup"
          ? await signup({ email, password })
          : await login({ email, password });
      onSuccess(user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not reach the server. Is the backend running?");
      }
    } finally {
      setSubmitting(false);
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
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting
          ? "Working…"
          : mode === "signup"
            ? "Create account"
            : "Log in"}
      </button>
    </form>
  );
}
