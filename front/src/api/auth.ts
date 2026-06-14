// Auth API calls and the data shapes that cross the wire.
//
// E2EE note: signup and login never send the raw password. They derive keys in
// the browser (see src/crypto), send only the `authCredential` to the server,
// and keep the encryption Cipher in `sessionKey`. The server therefore can't
// derive the encryption key.

import { ApiError, request } from "./client";
import { deriveKeys } from "../crypto/keys";
import { sessionKey } from "../crypto/session";

export interface Credentials {
  email: string;
  password: string;
}

// Mirrors `UserDTO` in back/internal/users/dto.go (the password hash is never
// sent back).
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export async function signup({ email, password }: Credentials): Promise<User> {
  const { cipher, authCredential } = await deriveKeys(email, password);
  const user = await request<User>("/users", {
    method: "POST",
    body: { email, password: authCredential },
  });
  await sessionKey.set(cipher);
  return user;
}

export async function login({ email, password }: Credentials): Promise<User> {
  const { cipher, authCredential } = await deriveKeys(email, password);
  const user = await request<User>("/sessions", {
    method: "POST",
    body: { email, password: authCredential },
  });
  await sessionKey.set(cipher);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await request<void>("/sessions", { method: "DELETE" });
  } finally {
    // Always forget the key locally, even if the network call failed.
    sessionKey.clear();
  }
}

// Returns null when not logged in (the server answers 401) rather than throwing,
// so callers can treat "logged out" as a normal state.
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await request<User>("/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}
