// A tiny wrapper around `fetch` so the rest of the app never deals with
// raw Response objects, status codes, or JSON parsing directly.
//
// Why centralise this:
//  - One place to set the base URL (the Go API runs on a different origin).
//  - One place to turn non-2xx responses into a real thrown Error, so callers
//    can use try/catch instead of checking `res.ok` everywhere.
//  - One place to attach auth headers later (e.g. a session token).

// The backend origin. In dev the Go server listens on :8081 while Vite serves
// the UI on :5173, so we point at it explicitly. Override per-environment with
// a `VITE_API_URL` entry in a `.env` file (see `.env.example`).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'

// Thrown for any non-2xx response. Carries the HTTP status so UI code can react
// differently to, say, a 409 (duplicate user) vs a 500.
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Generic JSON request. `T` is whatever shape we expect back on success.
export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    // Send and receive the session cookie even though the API is on a different
    // origin. Without this, the browser would neither store the Set-Cookie from
    // login nor attach the cookie to later requests.
    credentials: 'include',
    // Only serialise a body when one was provided.
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  // The Go handlers send `http.Error(w, msg, ...)` which is plain text, while
  // success responses are JSON. Read the raw text first, then decide.
  const raw = await res.text()

  if (!res.ok) {
    // Prefer the server's message; fall back to the status line.
    throw new ApiError(res.status, raw || res.statusText)
  }

  // Some endpoints may return an empty body (e.g. a future logout). Guard the
  // JSON.parse so that doesn't throw.
  return (raw ? JSON.parse(raw) : undefined) as T
}
