// A tiny wrapper around `fetch` so the rest of the app never deals with raw
// Response objects, status codes, or JSON parsing directly.

// Override per-environment with a `VITE_API_URL` entry in a `.env` file. In dev
// the Go server listens on :8081 while Vite serves the UI on :5173.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

// Thrown for any non-2xx response. Carries the HTTP status so UI code can react
// differently to, say, a 409 (duplicate user) vs a 500.
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    // Send and receive the session cookie even though the API is on a different
    // origin. Without this the browser would neither store the Set-Cookie from
    // login nor attach the cookie to later requests.
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // The Go handlers send `http.Error` (plain text) on failure but JSON on
  // success, so read the raw text first, then decide.
  const raw = await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, raw || res.statusText);
  }

  // Some endpoints return an empty body (e.g. logout), so guard the parse.
  return (raw ? JSON.parse(raw) : undefined) as T;
}
