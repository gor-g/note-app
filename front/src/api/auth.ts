// Auth-specific API calls. These map 1:1 onto backend routes and define the
// data shapes that cross the wire, so the rest of the UI stays typed.

import { ApiError, request } from './client'

// What the user types into the form.
export interface Credentials {
  email: string
  password: string
}

// What the backend returns for a user. Mirrors `UserDTO` in the Go code
// (back/internal/users/dto.go) — note the password hash is never sent back.
export interface User {
  id: string
  email: string
  createdAt: string
}

// Sign up = create a new user. Hits the existing `POST /users` handler.
export function signup(creds: Credentials): Promise<User> {
  return request<User>('/users', { method: 'POST', body: creds })
}

// Log in. On success the server sets an HttpOnly session cookie (handled by the
// browser automatically) and returns the user.
export function login(creds: Credentials): Promise<User> {
  return request<User>('/sessions', { method: 'POST', body: creds })
}

// Log out: deletes the session server-side and clears the cookie.
export function logout(): Promise<void> {
  return request<void>('/sessions', { method: 'DELETE' })
}

// Ask the server who the current session belongs to. Used on page load to
// restore a session from the cookie. Returns null when not logged in (the
// server answers 401) rather than throwing, so callers can treat "logged out"
// as a normal state.
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await request<User>('/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null
    }
    throw err
  }
}
