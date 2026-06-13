// Auth-specific API calls. These map 1:1 onto backend routes and define the
// data shapes that cross the wire, so the rest of the UI stays typed.

import { request } from './client'

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

// Log in. NOTE: the backend does NOT implement this yet — there is currently
// no `POST /sessions` route and no session/token mechanism at all. This call
// is wired up so the UI is ready, and will start working once we add the
// endpoint. Until then, attempting to log in will surface a clear error.
export function login(creds: Credentials): Promise<User> {
  return request<User>('/sessions', { method: 'POST', body: creds })
}
